import { describe, expect, it } from 'vite-plus/test';

import { OptionsSchema, validateName } from './options.js';

describe(validateName, () => {
  it('accepts valid npm package names', () => {
    expect(validateName('my-project').success).toBeTruthy();
    expect(validateName('foo123').success).toBeTruthy();
  });

  it('rejects names with uppercase letters', () => {
    expect(validateName('MyProject').success).toBeFalsy();
  });

  it('rejects names with leading dot or underscore', () => {
    expect(validateName('.foo').success).toBeFalsy();
    expect(validateName('_foo').success).toBeFalsy();
  });

  it('rejects names longer than 214 chars', () => {
    expect(validateName('a'.repeat(215)).success).toBeFalsy();
  });

  it('rejects empty names', () => {
    expect(validateName('').success).toBeFalsy();
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
    expect(result.languages).toStrictEqual(['typescript']);
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
    expect(result.success).toBeFalsy();
  });
});
