import { describe, expect, it } from 'vitest';

import type { Options } from '../options.js';
import { installCommandsFor } from './install.js';

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

describe('installCommandsFor', () => {
  it('returns pnpm install for TS+pnpm', () => {
    const cmds = installCommandsFor(baseOptions);
    expect(cmds).toEqual([
      { tool: 'pnpm', args: ['install'] },
      { tool: 'pnpm', args: ['exec', 'vp', 'config'] },
    ]);
  });

  it('returns bun install for TS+bun (vitest)', () => {
    const cmds = installCommandsFor({ ...baseOptions, packageManager: 'bun' });
    expect(cmds).toEqual([
      { tool: 'bun', args: ['install'] },
      { tool: 'bun', args: ['exec', 'vp', 'config'] },
    ]);
  });

  it('omits vp config when bunTest is bun-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, packageManager: 'bun', bunTest: 'bun' });
    expect(cmds).toEqual([{ tool: 'bun', args: ['install'] }]);
  });

  it('returns cargo fetch for Rust-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, languages: ['rust'] });
    expect(cmds).toEqual([{ tool: 'cargo', args: ['fetch'] }]);
  });

  it('returns uv sync for Python-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, languages: ['python'] });
    expect(cmds).toEqual([{ tool: 'uv', args: ['sync'] }]);
  });

  it('chains pnpm install + cargo fetch + uv sync for full polyglot', () => {
    const cmds = installCommandsFor({
      ...baseOptions,
      languages: ['typescript', 'rust', 'python'],
      monorepo: 'turbo',
      rustWorkspace: true,
    });
    expect(cmds).toEqual([
      { tool: 'pnpm', args: ['install'] },
      { tool: 'pnpm', args: ['exec', 'vp', 'config'] },
      { tool: 'cargo', args: ['fetch'] },
      { tool: 'uv', args: ['sync'] },
    ]);
  });

  it('skips cargo fetch in polyglot+rust without rustWorkspace (no root Cargo.toml)', () => {
    const cmds = installCommandsFor({
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
      rustWorkspace: false,
    });
    expect(cmds).toEqual([
      { tool: 'pnpm', args: ['install'] },
      { tool: 'pnpm', args: ['exec', 'vp', 'config'] },
      // no cargo fetch
    ]);
  });

  it('includes cargo fetch in polyglot+rust when rustWorkspace is true', () => {
    const cmds = installCommandsFor({
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
      rustWorkspace: true,
    });
    expect(cmds).toContainEqual({ tool: 'cargo', args: ['fetch'] });
  });
});
