import { describe, expect, it } from 'vite-plus/test';

import type { Options } from '../../../options.js';
import rustContributor from './rust.js';

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
  languages: ['rust'],
  monorepo: 'none',
  name: 'foo',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

describe(rustContributor, () => {
  it('returns empty contribution when rust is not in languages', () => {
    const contribution = rustContributor({ ...baseOptions, languages: ['typescript'] });
    expect(contribution.files).toHaveLength(0);
  });

  it('contributes Cargo.toml + src/main.rs + rustfmt + clippy at root for single-crate', () => {
    const contribution = rustContributor(baseOptions);
    const targets = contribution.files.map((file) => file.target);
    expect(targets).toContain('Cargo.toml');
    expect(targets).toContain('src/main.rs');
    expect(targets).toContain('rustfmt.toml');
    expect(targets).toContain('clippy.toml');
    expect(targets).not.toContain('crates/foo/Cargo.toml');
  });

  it('contributes workspace Cargo.toml + crates/<name>/ when rustWorkspace is true', () => {
    const contribution = rustContributor({ ...baseOptions, rustWorkspace: true });
    const targets = contribution.files.map((file) => file.target);
    expect(targets).toContain('Cargo.toml'); // Workspace root
    expect(targets).toContain('crates/foo/Cargo.toml');
    expect(targets).toContain('crates/foo/src/main.rs');
    expect(targets).toContain('rustfmt.toml');
    expect(targets).toContain('clippy.toml');
  });

  it('emits the workspace-Cargo.toml template at root when rustWorkspace is true', () => {
    const contribution = rustContributor({ ...baseOptions, rustWorkspace: true });
    const rootCargo = contribution.files.find((file) => file.target === 'Cargo.toml');
    expect(rootCargo?.template).toBe('rust/workspace-Cargo.toml.tmpl');
  });

  it('contributes crates/<name>/ in polyglot mode without workspace flag', () => {
    const polyglotOpts: Options = {
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
    };
    const contribution = rustContributor(polyglotOpts);
    const targets = contribution.files.map((file) => file.target);
    expect(targets).toContain('crates/foo/Cargo.toml');
    expect(targets).toContain('crates/foo/src/main.rs');
    expect(targets).not.toContain('Cargo.toml'); // No workspace root because rustWorkspace is false
  });

  it('emits both crates/<name>/ AND workspace root in polyglot + rustWorkspace mode', () => {
    const polyglotOpts: Options = {
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
      rustWorkspace: true,
    };
    const contribution = rustContributor(polyglotOpts);
    const targets = contribution.files.map((file) => file.target);
    expect(targets).toContain('Cargo.toml');
    expect(targets).toContain('crates/foo/Cargo.toml');
  });
});
