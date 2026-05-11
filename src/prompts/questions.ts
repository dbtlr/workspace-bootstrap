import { cancel, confirm, isCancel, multiselect, select, text } from '@clack/prompts';

import type { Options, PartialOptions } from '../options.js';
import { validateName } from '../options.js';

export const applyDefaults = (partial: PartialOptions): PartialOptions => {
  const isPolyglot = (partial.languages?.length ?? 0) > 1;
  const monorepoDefault = isPolyglot ? 'turbo' : 'none';

  const filled: PartialOptions = {
    bunTest: 'vitest',
    ci: false,
    commit: true,
    description: '',
    git: true,
    github: false,
    githubVisibility: 'private',
    install: true,
    monorepo: monorepoDefault,
    packageManager: 'pnpm',
    pythonWorkspace: false,
    rustWorkspace: false,
    verbose: false,
    ...partial,
  };

  // Polyglot forces a monorepo. If partial explicitly sets monorepo: 'none' with polyglot,
  // Override it to the default. This is the one place we override an explicit value.
  if (isPolyglot && filled.monorepo === 'none') {
    filled.monorepo = 'turbo';
  }

  return filled;
};

const cancelIfNeeded = <TValue>(value: TValue | symbol): TValue => {
  if (isCancel(value)) {
    cancel('Bootstrap cancelled.');
    process.exit(130);
  }
  return value;
};

export const askName = async (current: string | undefined): Promise<string> => {
  if (current !== undefined) {
    return current;
  }
  const value = await text({
    message: 'Project name?',
    placeholder: 'my-project',
    validate: (input: string | undefined) => {
      if (input === undefined) {
        return undefined;
      }
      const result = validateName(input);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
  });
  return cancelIfNeeded(value);
};

export const askDescription = async (current: string | undefined): Promise<string> => {
  if (current !== undefined) {
    return current;
  }
  const value = await text({
    defaultValue: '',
    message: 'Short description? (optional)',
    placeholder: '',
  });
  return cancelIfNeeded(value);
};

export const askLanguages = async (
  current: Options['languages'] | undefined,
): Promise<Options['languages']> => {
  if (current !== undefined) {
    return current;
  }
  const value = await multiselect({
    message: 'Which languages?',
    options: [
      { label: 'TypeScript', value: 'typescript' },
      { label: 'Rust', value: 'rust' },
      { label: 'Python', value: 'python' },
    ],
    required: true,
  });
  return cancelIfNeeded(value);
};

export const askMonorepo = async (
  current: Options['monorepo'] | undefined,
  languages: Options['languages'],
): Promise<Options['monorepo']> => {
  if (current !== undefined) {
    return current;
  }
  if (!languages.includes('typescript') && languages.length === 1) {
    return 'none';
  }
  const isPolyglot = languages.length > 1;
  const monorepoOptions: { label: string; value: Options['monorepo'] }[] = [
    { label: 'Turborepo', value: 'turbo' },
    { label: 'Nx', value: 'nx' },
  ];
  if (!isPolyglot) {
    monorepoOptions.push({ label: 'No, single-package', value: 'none' });
  }
  const value = await select<Options['monorepo']>({
    initialValue: isPolyglot ? 'turbo' : 'none',
    message: isPolyglot ? 'Polyglot monorepo tool?' : 'Use a monorepo?',
    options: monorepoOptions,
  });
  return cancelIfNeeded(value);
};

export const askPackageManager = async (
  current: Options['packageManager'] | undefined,
  languages: Options['languages'],
): Promise<Options['packageManager']> => {
  if (current !== undefined) {
    return current;
  }
  if (!languages.includes('typescript')) {
    return 'pnpm';
  }
  const value = await select<Options['packageManager']>({
    initialValue: 'pnpm',
    message: 'Package manager?',
    options: [
      { label: 'pnpm', value: 'pnpm' },
      { label: 'bun', value: 'bun' },
    ],
  });
  return cancelIfNeeded(value);
};

export const askBunTest = async (
  current: Options['bunTest'] | undefined,
  packageManager: Options['packageManager'],
  languages: Options['languages'],
): Promise<Options['bunTest']> => {
  if (current !== undefined) {
    return current;
  }
  if (!languages.includes('typescript') || packageManager !== 'bun') {
    return 'vitest';
  }
  const value = await select<Options['bunTest']>({
    initialValue: 'vitest',
    message: 'Test runner?',
    options: [
      { label: 'vitest (via Vite+)', value: 'vitest' },
      { label: 'bun:test', value: 'bun' },
      { label: 'both', value: 'both' },
    ],
  });
  return cancelIfNeeded(value);
};

export const askCi = async (current: boolean | undefined): Promise<boolean> => {
  if (current !== undefined) {
    return current;
  }
  const value = await confirm({
    initialValue: false,
    message: 'Add GitHub Actions CI?',
  });
  return cancelIfNeeded(value);
};

export const askGithub = async (
  current: boolean | undefined,
  ghAvailable: boolean,
): Promise<boolean> => {
  if (current !== undefined) {
    return current;
  }
  if (!ghAvailable) {
    return false;
  }
  const value = await confirm({
    initialValue: false,
    message: 'Create a GitHub repo via `gh`?',
  });
  return cancelIfNeeded(value);
};
