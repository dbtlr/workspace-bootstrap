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

  it('builds .gitignore from shared fragment plus per-language fragments', () => {
    const ts = sharedContributor({ ...baseOptions, languages: ['typescript'] });
    const tsGitignore = ts.files.find((f) => f.target === '.gitignore');
    expect(tsGitignore?.content).toContain('node_modules/');
    expect(tsGitignore?.content).toContain('.worktrees/');
  });

  it('emits CLAUDE.md as a symlink marker', () => {
    const contribution = sharedContributor(baseOptions);
    const claude = contribution.files.find((f) => f.target === 'CLAUDE.md');
    expect(claude?.content).toBe('@AGENTS.md\n');
    expect(claude?.raw).toBe(true);
  });

  it('includes Rust gitignore entries when rust is selected', () => {
    const contribution = sharedContributor({ ...baseOptions, languages: ['rust'] });
    const gitignore = contribution.files.find((f) => f.target === '.gitignore');
    expect(gitignore?.content).toContain('target/');
    expect(gitignore?.content).toContain('Cargo.lock');
  });

  it('includes Python gitignore entries when python is selected', () => {
    const contribution = sharedContributor({ ...baseOptions, languages: ['python'] });
    const gitignore = contribution.files.find((f) => f.target === '.gitignore');
    expect(gitignore?.content).toContain('__pycache__/');
    expect(gitignore?.content).toContain('.venv/');
  });

  it('includes fragments for every selected language in polyglot mode', () => {
    const contribution = sharedContributor({
      ...baseOptions,
      languages: ['typescript', 'rust', 'python'],
      monorepo: 'turbo',
    });
    const gitignore = contribution.files.find((f) => f.target === '.gitignore');
    expect(gitignore?.content).toContain('node_modules/');
    expect(gitignore?.content).toContain('target/');
    expect(gitignore?.content).toContain('__pycache__/');
  });
});
