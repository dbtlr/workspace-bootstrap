import { describe, expect, it } from 'vitest';

import type { Options } from '../../../options.js';
import { pythonContributor } from './python.js';

const baseOptions: Options = {
  name: 'foo',
  description: '',
  cwd: '/tmp',
  languages: ['python'],
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

describe('pythonContributor', () => {
  it('returns empty contribution when python is not in languages', () => {
    const contribution = pythonContributor({ ...baseOptions, languages: ['rust'] });
    expect(contribution.files).toHaveLength(0);
  });

  it('contributes pyproject + ruff + __init__ + tests at root for single-package', () => {
    const contribution = pythonContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('pyproject.toml');
    expect(targets).toContain('ruff.toml');
    expect(targets).toContain('src/foo/__init__.py');
    expect(targets).toContain('tests/test_smoke.py');
  });

  it('uses underscored package name for hyphenated project names', () => {
    const contribution = pythonContributor({ ...baseOptions, name: 'my-app' });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('src/my_app/__init__.py');
  });

  it('emits workspace root + packages/<name>/ when pythonWorkspace is true', () => {
    const contribution = pythonContributor({ ...baseOptions, pythonWorkspace: true });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('pyproject.toml'); // workspace root
    expect(targets).toContain('packages/foo/pyproject.toml');
    expect(targets).toContain('packages/foo/src/foo/__init__.py');
    expect(targets).toContain('packages/foo/tests/test_smoke.py');
  });

  it('emits the workspace-pyproject template at root when pythonWorkspace is true', () => {
    const contribution = pythonContributor({ ...baseOptions, pythonWorkspace: true });
    const rootPyproject = contribution.files.find((f) => f.target === 'pyproject.toml');
    expect(rootPyproject?.template).toBe('python/workspace-pyproject.toml.tmpl');
  });

  it('contributes py/<name>/ in polyglot mode without workspace flag', () => {
    const polyglotOpts: Options = {
      ...baseOptions,
      languages: ['typescript', 'python'],
      monorepo: 'turbo',
    };
    const contribution = pythonContributor(polyglotOpts);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('py/foo/pyproject.toml');
    expect(targets).toContain('py/foo/src/foo/__init__.py');
    expect(targets).not.toContain('pyproject.toml'); // no workspace root because pythonWorkspace is false
  });

  it('emits both py/<name>/ AND workspace root in polyglot + pythonWorkspace mode', () => {
    const polyglotOpts: Options = {
      ...baseOptions,
      languages: ['typescript', 'python'],
      monorepo: 'turbo',
      pythonWorkspace: true,
    };
    const contribution = pythonContributor(polyglotOpts);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('pyproject.toml');
    expect(targets).toContain('py/foo/pyproject.toml');
  });
});
