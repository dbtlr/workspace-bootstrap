import { describe, expect, it } from 'vite-plus/test';

import type { Options } from '../options.js';
import { installCommandsFor } from './install.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: '',
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

describe(installCommandsFor, () => {
  it('returns pnpm install for TS+pnpm', () => {
    const cmds = installCommandsFor(baseOptions);
    expect(cmds).toStrictEqual([
      { args: ['install'], tool: 'pnpm' },
      { args: ['exec', 'vp', 'config'], tool: 'pnpm' },
    ]);
  });

  it('returns bun install for TS+bun (vitest)', () => {
    const cmds = installCommandsFor({ ...baseOptions, packageManager: 'bun' });
    expect(cmds).toStrictEqual([
      { args: ['install'], tool: 'bun' },
      { args: ['exec', 'vp', 'config'], tool: 'bun' },
    ]);
  });

  it('omits vp config when bunTest is bun-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, bunTest: 'bun', packageManager: 'bun' });
    expect(cmds).toStrictEqual([{ args: ['install'], tool: 'bun' }]);
  });

  it('returns cargo fetch for Rust-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, languages: ['rust'] });
    expect(cmds).toStrictEqual([{ args: ['fetch'], tool: 'cargo' }]);
  });

  it('returns uv sync for Python-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, languages: ['python'] });
    expect(cmds).toStrictEqual([{ args: ['sync'], tool: 'uv' }]);
  });

  it('chains pnpm install + cargo fetch + uv sync for full polyglot', () => {
    const cmds = installCommandsFor({
      ...baseOptions,
      languages: ['typescript', 'rust', 'python'],
      monorepo: 'turbo',
      rustWorkspace: true,
    });
    expect(cmds).toStrictEqual([
      { args: ['install'], tool: 'pnpm' },
      { args: ['exec', 'vp', 'config'], tool: 'pnpm' },
      { args: ['fetch'], tool: 'cargo' },
      { args: ['sync'], tool: 'uv' },
    ]);
  });

  it('skips cargo fetch in polyglot+rust without rustWorkspace (no root Cargo.toml)', () => {
    const cmds = installCommandsFor({
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
      rustWorkspace: false,
    });
    expect(cmds).toStrictEqual([
      { args: ['install'], tool: 'pnpm' },
      { args: ['exec', 'vp', 'config'], tool: 'pnpm' },
      // No cargo fetch
    ]);
  });

  it('includes cargo fetch in polyglot+rust when rustWorkspace is true', () => {
    const cmds = installCommandsFor({
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
      rustWorkspace: true,
    });
    expect(cmds).toContainEqual({ args: ['fetch'], tool: 'cargo' });
  });
});
