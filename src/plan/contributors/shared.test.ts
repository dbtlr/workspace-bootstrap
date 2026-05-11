import { describe, expect, it } from 'vitest';

import type { Options } from '../../options.js';
import { sharedContributor } from './shared.js';

const baseOptions: Options = {
  name: 'foo',
  description: 'My project',
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

describe('sharedContributor', () => {
  it('contributes README, AGENTS.md, .editorconfig, mise.toml, .gitignore', () => {
    const contribution = sharedContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('README.md');
    expect(targets).toContain('AGENTS.md');
    expect(targets).toContain('CLAUDE.md');
    expect(targets).toContain('.editorconfig');
    expect(targets).toContain('mise.toml');
    expect(targets).toContain('.gitignore');
  });

  it('declares .gitignore as a composition of shared + per-language fragments', () => {
    const ts = sharedContributor({ ...baseOptions, languages: ['typescript'] });
    const tsGitignore = ts.files.find((f) => f.target === '.gitignore');
    expect(tsGitignore?.compose?.fragments).toEqual(['gitignore.shared', 'gitignore.ts']);
    expect(tsGitignore?.raw).toBe(true);
  });

  it('emits CLAUDE.md as a symlink marker', () => {
    const contribution = sharedContributor(baseOptions);
    const claude = contribution.files.find((f) => f.target === 'CLAUDE.md');
    expect(claude?.content).toBe('@AGENTS.md\n');
    expect(claude?.raw).toBe(true);
  });

  it('declares the Rust gitignore fragment when rust is selected', () => {
    const contribution = sharedContributor({ ...baseOptions, languages: ['rust'] });
    const gitignore = contribution.files.find((f) => f.target === '.gitignore');
    expect(gitignore?.compose?.fragments).toContain('gitignore.rust');
  });

  it('declares the Python gitignore fragment when python is selected', () => {
    const contribution = sharedContributor({ ...baseOptions, languages: ['python'] });
    const gitignore = contribution.files.find((f) => f.target === '.gitignore');
    expect(gitignore?.compose?.fragments).toContain('gitignore.python');
  });

  it('declares fragments for every selected language in polyglot mode', () => {
    const contribution = sharedContributor({
      ...baseOptions,
      languages: ['typescript', 'rust', 'python'],
      monorepo: 'turbo',
    });
    const gitignore = contribution.files.find((f) => f.target === '.gitignore');
    expect(gitignore?.compose?.fragments).toEqual([
      'gitignore.shared',
      'gitignore.ts',
      'gitignore.rust',
      'gitignore.python',
    ]);
  });
});
