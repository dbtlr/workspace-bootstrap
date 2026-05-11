import { describe, expect, it } from 'vitest';

import { applyDefaults } from './questions.js';

describe(applyDefaults, () => {
  it('defaults monorepo to none for single-language TS', () => {
    const out = applyDefaults({ cwd: '/tmp', languages: ['typescript'] });
    expect(out.monorepo).toBe('none');
  });

  it('defaults monorepo to turbo for polyglot', () => {
    const out = applyDefaults({ cwd: '/tmp', languages: ['typescript', 'rust'] });
    expect(out.monorepo).toBe('turbo');
  });

  it('defaults packageManager to pnpm', () => {
    const out = applyDefaults({ cwd: '/tmp', languages: ['typescript'] });
    expect(out.packageManager).toBe('pnpm');
  });

  it('defaults git/commit/install to true', () => {
    const out = applyDefaults({ cwd: '/tmp', languages: ['typescript'] });
    expect(out.git).toBe(true);
    expect(out.commit).toBe(true);
    expect(out.install).toBe(true);
  });

  it('preserves explicitly-set values', () => {
    const out = applyDefaults({
      cwd: '/tmp',
      languages: ['typescript'],
      monorepo: 'nx',
      packageManager: 'bun',
    });
    expect(out.packageManager).toBe('bun');
    expect(out.monorepo).toBe('nx');
  });

  it('overrides monorepo: none to turbo when polyglot', () => {
    const out = applyDefaults({
      cwd: '/tmp',
      languages: ['typescript', 'rust'],
      monorepo: 'none',
    });
    expect(out.monorepo).toBe('turbo');
  });

  it('preserves monorepo: nx for polyglot when explicitly set', () => {
    const out = applyDefaults({
      cwd: '/tmp',
      languages: ['typescript', 'rust'],
      monorepo: 'nx',
    });
    expect(out.monorepo).toBe('nx');
  });
});
