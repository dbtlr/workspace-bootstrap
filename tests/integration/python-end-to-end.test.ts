import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import type { Options } from '../../src/options.js';
import pythonContributor from '../../src/plan/contributors/languages/python.js';
import monorepoContributor from '../../src/plan/contributors/monorepo.js';
import sharedContributor from '../../src/plan/contributors/shared.js';
import { buildPlan } from '../../src/plan/index.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: 'A Python demo',
  git: true,
  github: false,
  githubVisibility: 'private',
  install: true,
  languages: ['python'],
  monorepo: 'none',
  name: 'pythy',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

const contributors = [sharedContributor, monorepoContributor, pythonContributor];

describe('python-only end-to-end scaffold', () => {
  it('single-package produces pyproject + src/<name>/', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'py-single-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, { ...baseOpts, cwd }, { targetDir: target });

    expect(existsSync(join(target, 'pyproject.toml'))).toBeTruthy();
    expect(existsSync(join(target, 'ruff.toml'))).toBeTruthy();
    expect(existsSync(join(target, 'src/pythy/__init__.py'))).toBeTruthy();
    expect(existsSync(join(target, 'tests/test_smoke.py'))).toBeTruthy();
  });

  it('underscores hyphenated names in the module path', async () => {
    const opts: Options = { ...baseOpts, name: 'my-py-app' };
    const cwd = mkdtempSync(join(tmpdir(), 'py-hyphen-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, { ...opts, cwd }, { targetDir: target });

    expect(existsSync(join(target, 'src/my_py_app/__init__.py'))).toBeTruthy();
  });

  it('workspace mode produces workspace pyproject + packages/<name>/', async () => {
    const opts: Options = { ...baseOpts, pythonWorkspace: true };
    const cwd = mkdtempSync(join(tmpdir(), 'py-ws-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, { ...opts, cwd }, { targetDir: target });

    const rootPy = readFileSync(join(target, 'pyproject.toml'), 'utf8');
    expect(rootPy).toContain('[tool.uv.workspace]');
    expect(rootPy).toContain('members = ["packages/*"]');
    expect(existsSync(join(target, 'packages/pythy/pyproject.toml'))).toBeTruthy();
    expect(existsSync(join(target, 'packages/pythy/src/pythy/__init__.py'))).toBeTruthy();
  });

  it('polyglot + pythonWorkspace uses py/* members glob (not packages/*)', async () => {
    const opts: Options = {
      ...baseOpts,
      languages: ['typescript', 'python'],
      monorepo: 'turbo',
      pythonWorkspace: true,
    };
    const cwd = mkdtempSync(join(tmpdir(), 'py-poly-ws-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, { ...opts, cwd }, { targetDir: target });

    const rootPy = readFileSync(join(target, 'pyproject.toml'), 'utf8');
    expect(rootPy).toContain('members = ["py/*"]');
    expect(rootPy).not.toContain('packages/*');
  });
});
