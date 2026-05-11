import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import type { Options } from '../options.js';
import { renderFile } from './render.js';

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

let tmpRoot: string;
beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'render-test-'));
});

describe('renderFile', () => {
  it('returns content verbatim when raw is true', async () => {
    const result = await renderFile(
      { target: 'foo.txt', content: 'hello', raw: true },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('hello');
  });

  it('renders an eta template with interpolation', async () => {
    const templatePath = join(tmpRoot, 'sample.txt.tmpl');
    writeFileSync(templatePath, 'name=<%= it.name %>');
    const result = await renderFile(
      { template: 'sample.txt.tmpl', target: 'sample.txt' },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('name=foo');
  });

  it('renders an eta template with conditionals', async () => {
    const templatePath = join(tmpRoot, 'sample.md.tmpl');
    writeFileSync(
      templatePath,
      '<% if (it.options.packageManager === "pnpm") { %>pnpm<% } else { %>bun<% } %>',
    );
    const result = await renderFile(
      { template: 'sample.md.tmpl', target: 'sample.md' },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('pnpm');
  });

  it('plain-copies templates with no .tmpl suffix', async () => {
    const templatePath = join(tmpRoot, 'static.txt');
    writeFileSync(templatePath, 'literal content');
    const result = await renderFile(
      { template: 'static.txt', target: 'static.txt' },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('literal content');
  });

  it('throws when neither template nor content is set', async () => {
    await expect(renderFile({ target: 'foo.txt' }, baseOptions, tmpRoot)).rejects.toThrow(
      /neither template nor content/,
    );
  });

  it('skips eta when raw is true even for a .tmpl file', async () => {
    const templatePath = join(tmpRoot, 'literal.txt.tmpl');
    writeFileSync(templatePath, 'name=<%= it.name %>');
    const result = await renderFile(
      { template: 'literal.txt.tmpl', target: 'literal.txt', raw: true },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('name=<%= it.name %>');
  });
});
