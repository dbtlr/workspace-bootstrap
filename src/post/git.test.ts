import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Options } from '../options.js';
import { exec } from '../util/exec.js';
import { createLogger } from '../util/log.js';
import { runGit } from './git.js';

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

const log = createLogger(false);

describe('runGit', () => {
  it('initializes a git repo and creates an initial commit', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'git-test-'));
    writeFileSync(join(dir, 'README.md'), '# foo');
    await runGit(dir, baseOptions, log);

    const status = await exec('git', ['log', '--oneline'], { cwd: dir });
    expect(status.code).toBe(0);
    expect(status.stdout).toContain('chore: initial commit');
  });

  it('initializes but does not commit when commit: false', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'git-test-'));
    writeFileSync(join(dir, 'README.md'), '# foo');
    await runGit(dir, { ...baseOptions, commit: false }, log);

    const status = await exec('git', ['log', '--oneline'], { cwd: dir });
    expect(status.code).not.toBe(0); // no commits
  });
});
