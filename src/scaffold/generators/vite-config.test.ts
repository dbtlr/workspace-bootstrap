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

  it('includes an fmt block with printWidth and singleQuote', () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain('fmt:');
    expect(out).toContain('printWidth: 100');
    expect(out).toContain('singleQuote: true');
  });
});
