import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Options } from '../../src/options.js';
import { rustContributor } from '../../src/plan/contributors/languages/rust.js';
import { monorepoContributor } from '../../src/plan/contributors/monorepo.js';
import { sharedContributor } from '../../src/plan/contributors/shared.js';
import { buildPlan } from '../../src/plan/index.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  name: 'rusty',
  description: 'A Rust demo',
  cwd: '/tmp',
  languages: ['rust'],
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

const contributors = [sharedContributor, monorepoContributor, rustContributor];

describe('Rust-only end-to-end scaffold', () => {
  it('single-crate produces Cargo.toml + src/main.rs at root', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'rust-single-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    expect(existsSync(join(target, 'Cargo.toml'))).toBe(true);
    expect(existsSync(join(target, 'src/main.rs'))).toBe(true);
    expect(existsSync(join(target, 'rustfmt.toml'))).toBe(true);
    expect(existsSync(join(target, 'clippy.toml'))).toBe(true);
    expect(existsSync(join(target, 'README.md'))).toBe(true);
    expect(existsSync(join(target, 'AGENTS.md'))).toBe(true);
  });

  it('Cargo.toml has the project name interpolated', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'rust-single-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    const cargo = readFileSync(join(target, 'Cargo.toml'), 'utf8');
    expect(cargo).toContain('name = "rusty"');
  });

  it('workspace mode produces workspace Cargo.toml + crates/<name>/', async () => {
    const opts: Options = { ...baseOpts, rustWorkspace: true };
    const cwd = mkdtempSync(join(tmpdir(), 'rust-ws-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    const rootCargo = readFileSync(join(target, 'Cargo.toml'), 'utf8');
    expect(rootCargo).toContain('[workspace]');
    expect(existsSync(join(target, 'crates/rusty/Cargo.toml'))).toBe(true);
    expect(existsSync(join(target, 'crates/rusty/src/main.rs'))).toBe(true);
  });
});
