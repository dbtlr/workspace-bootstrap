import { describe, expect, it } from 'vitest';

import type { Options } from '../../options.js';
import monorepoContributor from './monorepo.js';

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

describe(monorepoContributor, () => {
  it('returns empty when monorepo is none', () => {
    const contribution = monorepoContributor(baseOptions);
    expect(contribution.files).toHaveLength(0);
  });

  it('emits turbo.json + root package.json + pnpm-workspace.yaml for turbo + pnpm', () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: 'turbo' });
    const targets = contribution.files.map((file) => file.target);
    expect(targets).toContain('turbo.json');
    expect(targets).toContain('package.json');
    expect(targets).toContain('pnpm-workspace.yaml');
  });

  it('omits pnpm-workspace.yaml when packageManager is bun', () => {
    const contribution = monorepoContributor({
      ...baseOptions,
      monorepo: 'turbo',
      packageManager: 'bun',
    });
    const targets = contribution.files.map((file) => file.target);
    expect(targets).toContain('turbo.json');
    expect(targets).toContain('package.json');
    expect(targets).not.toContain('pnpm-workspace.yaml');
  });

  it('emits nx.json for nx mode', () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: 'nx' });
    const targets = contribution.files.map((file) => file.target);
    expect(targets).toContain('nx.json');
    expect(targets).not.toContain('turbo.json');
  });

  it('root package.json is generated content (not a template)', () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: 'turbo' });
    const pkg = contribution.files.find((file) => file.target === 'package.json');
    expect(pkg?.content).toBeDefined();
    expect(pkg?.raw).toBe(true);
  });
});
