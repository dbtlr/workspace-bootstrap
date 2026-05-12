import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Options } from '../../src/options.js';
import rustContributor from '../../src/plan/contributors/languages/rust.js';
import monorepoContributor from '../../src/plan/contributors/monorepo.js';
import sharedContributor from '../../src/plan/contributors/shared.js';
import { buildPlan } from '../../src/plan/index.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: 'A Rust demo',
  git: true,
  github: false,
  githubVisibility: 'private',
  install: true,
  languages: ['rust'],
  monorepo: 'none',
  name: 'rusty',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

const contributors = [sharedContributor, monorepoContributor, rustContributor];

describe('rust-only end-to-end scaffold', () => {
  it('single-crate produces Cargo.toml + src/main.rs at root', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'rust-single-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, { ...baseOpts, cwd }, { targetDir: target });

    expect(existsSync(join(target, 'Cargo.toml'))).toBeTruthy();
    expect(existsSync(join(target, 'src/main.rs'))).toBeTruthy();
    expect(existsSync(join(target, 'rustfmt.toml'))).toBeTruthy();
    expect(existsSync(join(target, 'clippy.toml'))).toBeTruthy();
    expect(existsSync(join(target, 'README.md'))).toBeTruthy();
    expect(existsSync(join(target, 'AGENTS.md'))).toBeTruthy();
  });

  it('cargo.toml has the project name interpolated', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'rust-single-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, { ...baseOpts, cwd }, { targetDir: target });

    const cargo = readFileSync(join(target, 'Cargo.toml'), 'utf8');
    expect(cargo).toContain('name = "rusty"');
  });

  it('workspace mode produces workspace Cargo.toml + crates/<name>/', async () => {
    const opts: Options = { ...baseOpts, rustWorkspace: true };
    const cwd = mkdtempSync(join(tmpdir(), 'rust-ws-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, { ...opts, cwd }, { targetDir: target });

    const rootCargo = readFileSync(join(target, 'Cargo.toml'), 'utf8');
    expect(rootCargo).toContain('[workspace]');
    expect(existsSync(join(target, 'crates/rusty/Cargo.toml'))).toBeTruthy();
    expect(existsSync(join(target, 'crates/rusty/src/main.rs'))).toBeTruthy();
  });
});
