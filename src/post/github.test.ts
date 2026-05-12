import { describe, expect, it } from 'vite-plus/test';

import type { Options } from '../options.js';
import { githubCommandsFor } from './github.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: 'A test project',
  git: true,
  github: true,
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

describe(githubCommandsFor, () => {
  it('returns empty when github is false', () => {
    const cmds = githubCommandsFor({ ...baseOptions, github: false }, false);
    expect(cmds).toStrictEqual([]);
  });

  it('returns empty when a remote already exists (skip, do not overwrite)', () => {
    const cmds = githubCommandsFor(baseOptions, true);
    expect(cmds).toStrictEqual([]);
  });

  it('builds gh repo create with --private --source=. --remote=origin --push for default', () => {
    const cmds = githubCommandsFor(baseOptions, false);
    expect(cmds).toStrictEqual([
      {
        args: [
          'repo',
          'create',
          'foo',
          '--private',
          '--source=.',
          '--remote=origin',
          '--push',
          '--description',
          'A test project',
        ],
        tool: 'gh',
      },
    ]);
  });

  it('uses --public when githubVisibility is public', () => {
    const cmds = githubCommandsFor({ ...baseOptions, githubVisibility: 'public' }, false);
    expect(cmds[0]?.args).toContain('--public');
    expect(cmds[0]?.args).not.toContain('--private');
  });

  it('uses --internal when githubVisibility is internal', () => {
    const cmds = githubCommandsFor({ ...baseOptions, githubVisibility: 'internal' }, false);
    expect(cmds[0]?.args).toContain('--internal');
  });

  it('uses owner/name format when githubOwner is set', () => {
    const cmds = githubCommandsFor({ ...baseOptions, githubOwner: 'dbtlr' }, false);
    expect(cmds[0]?.args).toContain('dbtlr/foo');
    expect(cmds[0]?.args).not.toContain('foo');
  });

  it('omits --push when commit is false (nothing to push)', () => {
    const cmds = githubCommandsFor({ ...baseOptions, commit: false }, false);
    expect(cmds[0]?.args).not.toContain('--push');
  });

  it('omits --description when description is empty', () => {
    const cmds = githubCommandsFor({ ...baseOptions, description: '' }, false);
    expect(cmds[0]?.args).not.toContain('--description');
  });
});
