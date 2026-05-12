import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Options } from '../../src/options.js';
import ciContributor from '../../src/plan/contributors/ci.js';
import pythonContributor from '../../src/plan/contributors/languages/python.js';
import rustContributor from '../../src/plan/contributors/languages/rust.js';
import tsContributor from '../../src/plan/contributors/languages/ts.js';
import monorepoContributor from '../../src/plan/contributors/monorepo.js';
import sharedContributor from '../../src/plan/contributors/shared.js';
import { buildPlan } from '../../src/plan/index.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  bunTest: 'vitest',
  ci: true,
  commit: true,
  cwd: '/tmp',
  description: 'CI test',
  git: true,
  github: false,
  githubVisibility: 'private',
  install: true,
  languages: ['typescript'],
  monorepo: 'none',
  name: 'ci-demo',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

const contributors = [
  sharedContributor,
  monorepoContributor,
  ciContributor,
  tsContributor,
  rustContributor,
  pythonContributor,
];

describe('ci workflow end-to-end', () => {
  it('does not emit a workflow when ci is false', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-off-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = { ...baseOpts, ci: false, cwd };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    expect(existsSync(join(target, '.github/workflows/ci.yml'))).toBeFalsy();
  });

  it('tS-only emits ts workflow with vp commands', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-ts-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = { ...baseOpts, cwd };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('voidzero-dev/setup-vp@v1');
    expect(yml).toContain('vp install');
    expect(yml).toContain('vp check');
    expect(yml).toContain('vp test');
    expect(yml).not.toContain('cargo');
    expect(yml).not.toContain('uv sync');
  });

  it('rust-only emits rust workflow with cargo commands', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-rust-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = { ...baseOpts, cwd, languages: ['rust'] };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('dtolnay/rust-toolchain');
    expect(yml).toContain('cargo fmt --check');
    expect(yml).toContain('cargo clippy');
    expect(yml).toContain('cargo test');
    expect(yml).not.toContain('vp install');
  });

  it('python-only emits python workflow with uv + ruff + pytest', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-py-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = { ...baseOpts, cwd, languages: ['python'] };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('astral-sh/setup-uv@v3');
    expect(yml).toContain('uv sync');
    expect(yml).toContain('uv run ruff check');
    expect(yml).toContain('uv run pytest');
  });

  it('polyglot (TS+Rust) emits polyglot workflow with both stacks', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-poly-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = {
      ...baseOpts,
      cwd,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
    };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('voidzero-dev/setup-vp@v1');
    expect(yml).toContain('dtolnay/rust-toolchain');
    expect(yml).toContain('vp check');
    expect(yml).toContain('cargo test');
    expect(yml).not.toContain('uv sync');
  });

  it('polyglot (all 3 languages) includes all three stack blocks', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-all-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = {
      ...baseOpts,
      cwd,
      languages: ['typescript', 'rust', 'python'],
      monorepo: 'turbo',
    };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('voidzero-dev/setup-vp@v1');
    expect(yml).toContain('dtolnay/rust-toolchain');
    expect(yml).toContain('astral-sh/setup-uv@v3');
    expect(yml).toContain('vp test');
    expect(yml).toContain('cargo test');
    expect(yml).toContain('uv run pytest');
  });
});
