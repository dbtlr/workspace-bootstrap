import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Options } from '../../src/options.js';
import { pythonContributor } from '../../src/plan/contributors/languages/python.js';
import { rustContributor } from '../../src/plan/contributors/languages/rust.js';
import { tsContributor } from '../../src/plan/contributors/languages/ts.js';
import { monorepoContributor } from '../../src/plan/contributors/monorepo.js';
import { sharedContributor } from '../../src/plan/contributors/shared.js';
import { buildPlan } from '../../src/plan/index.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  name: 'multi',
  description: 'Polyglot demo',
  cwd: '/tmp',
  languages: ['typescript', 'rust'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'turbo',
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

const contributors = [
  sharedContributor,
  monorepoContributor,
  tsContributor,
  rustContributor,
  pythonContributor,
];

describe('Polyglot end-to-end scaffold', () => {
  it('TS+Rust turbo produces monorepo root + apps/<name>/ + crates/<name>/', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'poly-ts-rust-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    expect(existsSync(join(target, 'turbo.json'))).toBe(true);
    expect(existsSync(join(target, 'package.json'))).toBe(true);
    expect(existsSync(join(target, 'pnpm-workspace.yaml'))).toBe(true);
    expect(existsSync(join(target, 'apps/multi/package.json'))).toBe(true);
    expect(existsSync(join(target, 'apps/multi/vite.config.ts'))).toBe(true);
    expect(existsSync(join(target, 'crates/multi/Cargo.toml'))).toBe(true);
    expect(existsSync(join(target, 'crates/multi/src/main.rs'))).toBe(true);
    expect(existsSync(join(target, 'README.md'))).toBe(true);
    expect(existsSync(join(target, 'AGENTS.md'))).toBe(true);
  });

  it('root package.json has turbo as a devDependency and is private', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'poly-ts-rust-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    const rootPkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')) as {
      name: string;
      private: boolean;
      devDependencies: Record<string, string>;
      packageManager: string;
    };
    expect(rootPkg.name).toBe('multi');
    expect(rootPkg.private).toBe(true);
    expect(rootPkg.devDependencies.turbo).toBeDefined();
    expect(rootPkg.packageManager).toMatch(/^pnpm@/);
  });

  it('app package.json does NOT include packageManager (only root does)', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'poly-ts-rust-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    const appPkg = JSON.parse(readFileSync(join(target, 'apps/multi/package.json'), 'utf8')) as {
      packageManager?: string;
    };
    expect(appPkg.packageManager).toBeUndefined();
  });

  it('TS+Rust+Python produces all three language sub-trees', async () => {
    const opts: Options = { ...baseOpts, languages: ['typescript', 'rust', 'python'] };
    const cwd = mkdtempSync(join(tmpdir(), 'poly-all-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    expect(existsSync(join(target, 'apps/multi/package.json'))).toBe(true);
    expect(existsSync(join(target, 'crates/multi/Cargo.toml'))).toBe(true);
    expect(existsSync(join(target, 'py/multi/pyproject.toml'))).toBe(true);
    expect(existsSync(join(target, 'py/multi/src/multi/__init__.py'))).toBe(true);
  });

  it('mise.toml includes node, rust, and python for full polyglot', async () => {
    const opts: Options = { ...baseOpts, languages: ['typescript', 'rust', 'python'] };
    const cwd = mkdtempSync(join(tmpdir(), 'poly-all-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    const mise = readFileSync(join(target, 'mise.toml'), 'utf8');
    expect(mise).toContain('node =');
    expect(mise).toContain('rust =');
    expect(mise).toContain('python =');
  });
});
