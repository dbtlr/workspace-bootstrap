import { describe, expect, it } from 'vitest';

import type { Options } from '../../options.js';
import renderViteConfig from './vite-config.js';

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

describe(renderViteConfig, () => {
  it('includes the defineConfig import and call', () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain("import { defineConfig } from 'vite-plus'");
    expect(out).toContain('defineConfig(');
  });

  it('includes a staged block by default', () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain('staged:');
    expect(out).toContain('vp check --fix');
  });

  it('omits the staged block when bunTest is bun-only (no vp)', () => {
    const out = renderViteConfig({ ...baseOptions, bunTest: 'bun', packageManager: 'bun' });
    expect(out).not.toContain('staged:');
  });

  it('includes an fmt block with ignorePatterns, singleQuote, and sort options', () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain('fmt:');
    expect(out).toContain('singleQuote: true');
    expect(out).toContain('sortImports: true');
    expect(out).toContain('sortPackageJson: true');
    expect(out).toContain("'pnpm-lock.yaml'");
  });

  it('includes the full lint rule set (plugins, categories, jest-off, env, options)', () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain(
      "plugins: ['typescript', 'import', 'eslint', 'unicorn', 'oxc', 'promise', 'node', 'vitest']",
    );
    expect(out).toContain('categories:');
    expect(out).toContain("correctness: 'error'");
    expect(out).toContain("'import/no-named-export': 'off'");
    expect(out).toContain("'jest/valid-title': 'off'");
    expect(out).toContain("'vitest/no-importing-vitest-globals': 'off'");
    expect(out).toContain('builtin: true');
    expect(out).toContain('denyWarnings: true');
    expect(out).toContain('maxWarnings: 0');
  });
});
