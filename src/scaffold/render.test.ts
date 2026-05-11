import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import type { Options } from '../options.js';
import { renderFile } from './render.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: 'My project',
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

let tmpRoot = '';
beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'render-test-'));
});

describe(renderFile, () => {
  it('returns content verbatim when raw is true', async () => {
    const result = await renderFile(
      { content: 'hello', raw: true, target: 'foo.txt' },
      baseOptions,
      { templatesRoot: tmpRoot },
    );
    expect(result).toBe('hello');
  });

  it('renders an eta template with interpolation', async () => {
    const templatePath = join(tmpRoot, 'sample.txt.tmpl');
    writeFileSync(templatePath, 'name=<%= it.name %>');
    const result = await renderFile(
      { target: 'sample.txt', template: 'sample.txt.tmpl' },
      baseOptions,
      { templatesRoot: tmpRoot },
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
      { target: 'sample.md', template: 'sample.md.tmpl' },
      baseOptions,
      { templatesRoot: tmpRoot },
    );
    expect(result).toBe('pnpm');
  });

  it('plain-copies templates with no .tmpl suffix', async () => {
    const templatePath = join(tmpRoot, 'static.txt');
    writeFileSync(templatePath, 'literal content');
    const result = await renderFile({ target: 'static.txt', template: 'static.txt' }, baseOptions, {
      templatesRoot: tmpRoot,
    });
    expect(result).toBe('literal content');
  });

  it('throws when neither template, content, nor compose is set', async () => {
    await expect(
      renderFile({ target: 'foo.txt' }, baseOptions, { templatesRoot: tmpRoot }),
    ).rejects.toThrow(/neither template, content, nor compose/);
  });

  it('composes content from fragments under templates/fragments/', async () => {
    const { mkdirSync, writeFileSync: writeFragmentSync } = await import('node:fs');
    mkdirSync(join(tmpRoot, 'fragments'), { recursive: true });
    writeFragmentSync(join(tmpRoot, 'fragments', 'one'), 'first\n');
    writeFragmentSync(join(tmpRoot, 'fragments', 'two'), 'second\n');

    const result = await renderFile(
      { compose: { fragments: ['one', 'two'] }, raw: true, target: '.gitignore' },
      baseOptions,
      { templatesRoot: tmpRoot },
    );
    expect(result).toBe('first\n\nsecond\n');
  });

  it('compose silently skips missing fragments', async () => {
    const { mkdirSync, writeFileSync: writeFragmentSync } = await import('node:fs');
    mkdirSync(join(tmpRoot, 'fragments'), { recursive: true });
    writeFragmentSync(join(tmpRoot, 'fragments', 'only'), 'present\n');

    const result = await renderFile(
      { compose: { fragments: ['only', 'missing'] }, raw: true, target: '.gitignore' },
      baseOptions,
      { templatesRoot: tmpRoot },
    );
    expect(result).toBe('present\n');
  });

  it('skips eta when raw is true even for a .tmpl file', async () => {
    const templatePath = join(tmpRoot, 'literal.txt.tmpl');
    writeFileSync(templatePath, 'name=<%= it.name %>');
    const result = await renderFile(
      { raw: true, target: 'literal.txt', template: 'literal.txt.tmpl' },
      baseOptions,
      { templatesRoot: tmpRoot },
    );
    expect(result).toBe('name=<%= it.name %>');
  });
});
