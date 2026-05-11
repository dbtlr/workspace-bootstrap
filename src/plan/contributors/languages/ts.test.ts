import { describe, expect, it } from 'vitest';

import type { Options } from '../../../options.js';
import { tsContributor } from './ts.js';

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

describe('tsContributor', () => {
  it('returns empty contribution when TypeScript is not in languages', () => {
    const contribution = tsContributor({ ...baseOptions, languages: ['rust'] });
    expect(contribution.files).toHaveLength(0);
  });

  it('contributes tsconfig, package.json, vite.config.ts, src, test', () => {
    const contribution = tsContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('tsconfig.json');
    expect(targets).toContain('package.json');
    expect(targets).toContain('vite.config.ts');
    expect(targets).toContain('src/index.ts');
    expect(targets).toContain('tests/smoke.test.ts');
  });

  it('does not emit standalone .oxlintrc.json or .oxfmtrc.json (Vite+ uses vite.config.ts)', () => {
    const contribution = tsContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).not.toContain('.oxlintrc.json');
    expect(targets).not.toContain('.oxfmtrc.json');
  });

  it('package.json content reflects the project name and pnpm', () => {
    const contribution = tsContributor(baseOptions);
    const pkg = contribution.files.find((f) => f.target === 'package.json');
    expect(pkg?.content).toContain('"name": "foo"');
    expect(pkg?.content).toContain('pnpm@');
  });

  it('emits files under apps/<name>/ when monorepo is turbo', () => {
    const contribution = tsContributor({ ...baseOptions, monorepo: 'turbo' });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('apps/foo/tsconfig.json');
    expect(targets).toContain('apps/foo/package.json');
    expect(targets).toContain('apps/foo/vite.config.ts');
    expect(targets).toContain('apps/foo/src/index.ts');
    expect(targets).toContain('apps/foo/tests/smoke.test.ts');
  });

  it('does not emit packageManager field when in monorepo mode', () => {
    const contribution = tsContributor({ ...baseOptions, monorepo: 'turbo' });
    const pkg = contribution.files.find((f) => f.target === 'apps/foo/package.json');
    const parsed = JSON.parse(pkg?.content ?? '{}') as { packageManager?: string };
    expect(parsed.packageManager).toBeUndefined();
  });

  it('emits packageManager field when not in monorepo mode', () => {
    const contribution = tsContributor(baseOptions);
    const pkg = contribution.files.find((f) => f.target === 'package.json');
    const parsed = JSON.parse(pkg?.content ?? '{}') as { packageManager?: string };
    expect(parsed.packageManager).toMatch(/^pnpm@/);
  });

  it('also emits files under apps/<name>/ for nx mode', () => {
    const contribution = tsContributor({ ...baseOptions, monorepo: 'nx' });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('apps/foo/tsconfig.json');
  });
});
