import { describe, expect, it } from 'vitest';

import { OptionsSchema, validateName } from './options.js';

describe(validateName, () => {
  it('accepts valid npm package names', () => {
    expect(validateName('my-project').success).toBe(true);
    expect(validateName('foo123').success).toBe(true);
  });

  it('rejects names with uppercase letters', () => {
    expect(validateName('MyProject').success).toBe(false);
  });

  it('rejects names with leading dot or underscore', () => {
    expect(validateName('.foo').success).toBe(false);
    expect(validateName('_foo').success).toBe(false);
  });

  it('rejects names longer than 214 chars', () => {
    expect(validateName('a'.repeat(215)).success).toBe(false);
  });

  it('rejects empty names', () => {
    expect(validateName('').success).toBe(false);
  });
});

describe(OptionsSchema.parse.bind(OptionsSchema), () => {
  it('parses a minimal valid options object', () => {
    const result = OptionsSchema.parse({
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
    });
    expect(result.name).toBe('foo');
    expect(result.languages).toEqual(['typescript']);
  });

  it('rejects empty languages array', () => {
    const result = OptionsSchema.safeParse({
      bunTest: 'vitest',
      ci: false,
      commit: true,
      cwd: '/tmp',
      description: '',
      git: true,
      github: false,
      githubVisibility: 'private',
      install: true,
      languages: [],
      monorepo: 'none',
      name: 'foo',
      packageManager: 'pnpm',
      pythonWorkspace: false,
      rustWorkspace: false,
      verbose: false,
    });
    expect(result.success).toBe(false);
  });
});
