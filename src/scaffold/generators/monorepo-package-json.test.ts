import { describe, expect, it } from 'vite-plus/test';

import type { Options } from '../../options.js';
import renderMonorepoPackageJson from './monorepo-package-json.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: 'Polyglot project',
  git: true,
  github: false,
  githubVisibility: 'private',
  install: true,
  languages: ['typescript', 'rust'],
  monorepo: 'turbo',
  name: 'my-mono',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

describe(renderMonorepoPackageJson, () => {
  it('emits a name and private:true', () => {
    const parsed = JSON.parse(renderMonorepoPackageJson(baseOptions));
    expect(parsed.name).toBe('my-mono');
    expect(parsed.private).toBeTruthy();
  });

  it('includes a workspaces array for bun', () => {
    const parsed = JSON.parse(renderMonorepoPackageJson({ ...baseOptions, packageManager: 'bun' }));
    expect(parsed.workspaces).toStrictEqual(['apps/*', 'packages/*']);
  });

  it('omits workspaces for pnpm (since pnpm-workspace.yaml is separate)', () => {
    const parsed = JSON.parse(renderMonorepoPackageJson(baseOptions));
    expect(parsed.workspaces).toBeUndefined();
  });

  it('includes turbo as a devDependency when monorepo is turbo', () => {
    const parsed = JSON.parse(renderMonorepoPackageJson(baseOptions));
    expect(parsed.devDependencies.turbo).toBeDefined();
  });

  it('includes nx as a devDependency when monorepo is nx', () => {
    const parsed = JSON.parse(renderMonorepoPackageJson({ ...baseOptions, monorepo: 'nx' }));
    expect(parsed.devDependencies.nx).toBeDefined();
    expect(parsed.devDependencies.turbo).toBeUndefined();
  });

  it('sets packageManager based on options', () => {
    const pnpm = JSON.parse(renderMonorepoPackageJson(baseOptions));
    expect(pnpm.packageManager).toMatch(/^pnpm@/);
    const bun = JSON.parse(renderMonorepoPackageJson({ ...baseOptions, packageManager: 'bun' }));
    expect(bun.packageManager).toMatch(/^bun@/);
  });
});
