import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import type { Options } from '../../src/options.js';
import tsContributor from '../../src/plan/contributors/languages/ts.js';
import sharedContributor from '../../src/plan/contributors/shared.js';
import { buildPlan } from '../../src/plan/index.js';
import { executePlan } from '../../src/scaffold/index.js';

const opts: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: 'A demo',
  git: true,
  github: false,
  githubVisibility: 'private',
  install: true,
  languages: ['typescript'],
  monorepo: 'none',
  name: 'demo-app',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

describe('tS-only end-to-end scaffold', () => {
  it.each([
    'README.md',
    'AGENTS.md',
    'CLAUDE.md',
    '.editorconfig',
    'mise.toml',
    '.gitignore',
    'tsconfig.json',
    'package.json',
    'vite.config.ts',
    'src/index.ts',
    'tests/smoke.test.ts',
  ])('produces a complete project structure %s', async (file) => {
    const cwd = mkdtempSync(join(tmpdir(), 'e2e-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, { ...opts, cwd }, { targetDir: target });

    expect(existsSync(join(target, file))).toBeTruthy();
  });

  it('package.json is valid JSON with the expected fields', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'e2e-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, { ...opts, cwd }, { targetDir: target });

    const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('demo-app');
    expect(pkg.type).toBe('module');
    expect(pkg.devDependencies['vite-plus']).toBeDefined();
    expect(pkg.devDependencies.typescript).toBeDefined();
  });

  it('rEADME.md interpolates the project name', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'e2e-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, { ...opts, cwd }, { targetDir: target });

    const readme = readFileSync(join(target, 'README.md'), 'utf8');
    expect(readme).toContain('# demo-app');
  });

  it('vite.config.ts contains the staged block', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'e2e-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, { ...opts, cwd }, { targetDir: target });

    const viteConfig = readFileSync(join(target, 'vite.config.ts'), 'utf8');
    expect(viteConfig).toContain('staged:');
    expect(viteConfig).toContain('vp check --fix');
  });
});
