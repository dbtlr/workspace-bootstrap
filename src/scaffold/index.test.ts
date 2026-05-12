import { lstatSync, mkdtempSync, readFileSync, readlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Options } from '../options.js';
import type { Plan } from '../plan/contributors.js';
import { executePlan } from './index.js';

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

describe(executePlan, () => {
  it('writes raw-content files into the target directory', async () => {
    const targetDir = mkdtempSync(join(tmpdir(), 'exec-plan-'));
    const plan: Plan = {
      deps: {},
      files: [
        { content: '# foo\n', raw: true, target: 'README.md' },
        { content: '{}\n', raw: true, target: 'config/app.json' },
      ],
      postSteps: [],
    };
    await executePlan(plan, baseOptions, { targetDir });
    expect(readFileSync(join(targetDir, 'README.md'), 'utf8')).toBe('# foo\n');
    expect(readFileSync(join(targetDir, 'config/app.json'), 'utf8')).toBe('{}\n');
  });

  it('creates nested directories as needed', async () => {
    const targetDir = mkdtempSync(join(tmpdir(), 'exec-plan-'));
    const plan: Plan = {
      deps: {},
      files: [{ content: 'export {}', raw: true, target: 'src/util/foo.ts' }],
      postSteps: [],
    };
    await executePlan(plan, baseOptions, { targetDir });
    expect(readFileSync(join(targetDir, 'src/util/foo.ts'), 'utf8')).toBe('export {}');
  });

  // oxlint-disable-next-line jest/prefer-ending-with-an-expect
  it('creates CLAUDE.md as a symlink to AGENTS.md', async () => {
    const targetDir = mkdtempSync(join(tmpdir(), 'exec-plan-'));
    const plan: Plan = {
      deps: {},
      files: [
        { content: '# AGENTS\n', raw: true, target: 'AGENTS.md' },
        { content: '@AGENTS.md\n', raw: true, target: 'CLAUDE.md' },
      ],
      postSteps: [],
    };
    await executePlan(plan, baseOptions, { targetDir });

    const claudeMdPath = join(targetDir, 'CLAUDE.md');
    const stat = lstatSync(claudeMdPath);
    if (stat.isSymbolicLink()) {
      const target = readlinkSync(claudeMdPath);
      // oxlint-disable-next-line jest/no-conditional-expect
      expect(target).toBe('AGENTS.md');
    } else {
      // Symlink fallback path — confirm the file has the import-syntax content.
      // oxlint-disable-next-line jest/no-conditional-expect
      expect(readFileSync(claudeMdPath, 'utf8')).toBe('@AGENTS.md\n');
    }
  });
});
