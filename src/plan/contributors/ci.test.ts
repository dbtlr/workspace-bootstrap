import { describe, expect, it } from 'vitest';

import type { Options } from '../../options.js';
import ciContributor from './ci.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: true,
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

describe('ci contributor', () => {
  it('returns empty when ci is false', () => {
    const contribution = ciContributor({ ...baseOptions, ci: false });
    expect(contribution.files).toHaveLength(0);
  });

  it('emits ts.yml template for TS-only', () => {
    const contribution = ciContributor(baseOptions);
    const workflowFile = contribution.files.find(
      (file) => file.target === '.github/workflows/ci.yml',
    );
    expect(workflowFile?.template).toBe('ci/ts.yml.tmpl');
  });

  it('emits rust.yml template for Rust-only', () => {
    const contribution = ciContributor({ ...baseOptions, languages: ['rust'] });
    const workflowFile = contribution.files.find(
      (file) => file.target === '.github/workflows/ci.yml',
    );
    expect(workflowFile?.template).toBe('ci/rust.yml.tmpl');
  });

  it('emits python.yml template for Python-only', () => {
    const contribution = ciContributor({ ...baseOptions, languages: ['python'] });
    const workflowFile = contribution.files.find(
      (file) => file.target === '.github/workflows/ci.yml',
    );
    expect(workflowFile?.template).toBe('ci/python.yml.tmpl');
  });

  it('emits polyglot.yml template for 2+ languages', () => {
    const contribution = ciContributor({
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
    });
    const workflowFile = contribution.files.find(
      (file) => file.target === '.github/workflows/ci.yml',
    );
    expect(workflowFile?.template).toBe('ci/polyglot.yml.tmpl');
  });

  it('always emits exactly one workflow file', () => {
    const contribution = ciContributor(baseOptions);
    expect(contribution.files).toHaveLength(1);
  });
});
