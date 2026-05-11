import { describe, expect, it } from 'vitest';

import type { Options } from '../../options.js';
import type { PkgDeps } from '../../plan/contributors.js';
import renderPackageJson from './package-json.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: 'My project',
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

describe(renderPackageJson, () => {
  it('produces a valid JSON string', () => {
    const deps: PkgDeps = { dependencies: { zod: '^4.0.0' }, scripts: {} };
    const parsed = JSON.parse(renderPackageJson(baseOptions, deps));
    expect(parsed.name).toBe('foo');
    expect(parsed.type).toBe('module');
    expect(parsed.dependencies.zod).toBe('^4.0.0');
  });

  it('includes the description', () => {
    const parsed = JSON.parse(renderPackageJson({ ...baseOptions, description: 'A thing' }, {}));
    expect(parsed.description).toBe('A thing');
  });

  it('sets packageManager based on options', () => {
    const pnpm = JSON.parse(renderPackageJson(baseOptions, {}));
    expect(pnpm.packageManager).toMatch(/^pnpm@/);
    const bun = JSON.parse(renderPackageJson({ ...baseOptions, packageManager: 'bun' }, {}));
    expect(bun.packageManager).toMatch(/^bun@/);
  });

  it('adds bun:test script when bunTest is bun or both', () => {
    const bothOpts: Options = { ...baseOptions, bunTest: 'both', packageManager: 'bun' };
    const parsed = JSON.parse(renderPackageJson(bothOpts, {}));
    expect(parsed.scripts['test:bun']).toBe('bun test');
  });
});
