import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import templatesDir from './paths.js';

describe(templatesDir, () => {
  it('resolves to a directory that exists', () => {
    const dir = templatesDir();
    expect(existsSync(dir)).toBeTruthy();
  });

  it('points to the templates dir at the repo root', () => {
    const dir = templatesDir();
    expect(dir.endsWith('/templates') || dir.endsWith(String.raw`\templates`)).toBeTruthy();
  });
});
