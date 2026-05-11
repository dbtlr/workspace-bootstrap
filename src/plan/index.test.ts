import { describe, expect, it } from 'vitest';

import type { Options } from '../options.js';
import { buildPlan } from './index.js';

const baseOptions: Options = {
  name: 'foo',
  description: '',
  cwd: '/tmp',
  languages: ['typescript'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'none',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

describe('buildPlan', () => {
  it('returns a Plan with empty contributions when no contributors registered', () => {
    const plan = buildPlan(baseOptions, []);
    expect(plan.files).toEqual([]);
    expect(plan.postSteps).toEqual([]);
  });

  it('merges file plans from multiple contributors', () => {
    const plan = buildPlan(baseOptions, [
      () => ({
        files: [{ template: 'a.txt', target: 'a.txt' }],
        postSteps: [],
        deps: {},
      }),
      () => ({
        files: [{ template: 'b.txt', target: 'b.txt' }],
        postSteps: [],
        deps: {},
      }),
    ]);
    expect(plan.files).toHaveLength(2);
    expect(plan.files[0]?.target).toBe('a.txt');
    expect(plan.files[1]?.target).toBe('b.txt');
  });

  it('merges TS deps from multiple contributors', () => {
    const plan = buildPlan(baseOptions, [
      () => ({ files: [], postSteps: [], deps: { ts: { dependencies: { zod: '^4.0.0' } } } }),
      () => ({ files: [], postSteps: [], deps: { ts: { dependencies: { citty: '^0.1.0' } } } }),
    ]);
    expect(plan.deps.ts?.dependencies).toEqual({
      zod: '^4.0.0',
      citty: '^0.1.0',
    });
  });
});
