import { describe, expect, it } from 'vitest';

import type { Options } from '../options.js';
import { buildPlan } from './index.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: '',
  git: true,
  github: false,
  githubVisibility: 'private',
  install: true,
  languages: ['typescript'],
  monorepo: 'none',
  name: 'foo',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

describe(buildPlan, () => {
  it('returns a Plan with empty contributions when no contributors registered', () => {
    const plan = buildPlan(baseOptions, []);
    expect(plan.files).toStrictEqual([]);
    expect(plan.postSteps).toStrictEqual([]);
  });

  it('merges file plans from multiple contributors', () => {
    const plan = buildPlan(baseOptions, [
      () => ({
        deps: {},
        files: [{ target: 'a.txt', template: 'a.txt' }],
        postSteps: [],
      }),
      () => ({
        deps: {},
        files: [{ target: 'b.txt', template: 'b.txt' }],
        postSteps: [],
      }),
    ]);
    expect(plan.files).toHaveLength(2);
    expect(plan.files[0]?.target).toBe('a.txt');
    expect(plan.files[1]?.target).toBe('b.txt');
  });

  it('merges TS deps from multiple contributors', () => {
    const plan = buildPlan(baseOptions, [
      () => ({ deps: { ts: { dependencies: { zod: '^4.0.0' } } }, files: [], postSteps: [] }),
      () => ({ deps: { ts: { dependencies: { citty: '^0.1.0' } } }, files: [], postSteps: [] }),
    ]);
    expect(plan.deps.ts?.dependencies).toStrictEqual({
      citty: '^0.1.0',
      zod: '^4.0.0',
    });
  });
});
