import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/cli.ts'],
    dts: {
      tsgo: true,
    },
    format: ['esm'],
  },
  fmt: {
    ignorePatterns: [
      'pnpm-lock.yaml',
      'dist/**',
      'build/**',
      'node_modules/**',
      '.docs/**',
      '.agents/**',
      '.codex/**',
      '.turbo/**',
      '.vite-hooks/**',
      '.worktrees/**',
      '.claude/**',
      '.vscode/**',
      'coverage/**',
      'templates/**',
    ],
    singleQuote: true,
    sortImports: true,

    sortPackageJson: true,
  },

  lint: {
    categories: {
      correctness: 'error',
      nursery: 'off',
      pedantic: 'off',
      perf: 'error',
      restriction: 'off',
      style: 'warn',
      suspicious: 'error',
    },

    env: {
      builtin: true,
    },

    ignorePatterns: [
      'bun.lock',
      '.vscode',
      'node_modules',
      '.agents',
      '.codex',
      'build',
      'dist',
      '.turbo',
      '.vite-hooks',
      'coverage',
      'templates',
    ],

    options: {
      denyWarnings: true,
      maxWarnings: 0,
      typeAware: true,
      typeCheck: true,
    },

    plugins: ['typescript', 'import', 'eslint', 'unicorn', 'oxc', 'promise', 'node', 'vitest'],

    rules: {
      'capitalized-comments': 'off',
      'exports-last': 'off',
      'func-style': [
        'warn',
        'declaration',
        {
          allowArrowFunctions: true,
        },
      ],
      'id-length': 'off',
      'import/group-exports': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-export': 'off',
      'import/no-nodejs-modules': 'off',
      'import/prefer-default-export': 'off',
      'jest/no-hooks': 'off',
      'jest/require-hook': 'off',
      'jest/valid-title': 'off',
      'no-continue': 'off',
      'max-expects': ['warn', { max: 10 }],
      'max-statements': ['warn', 40],

      'no-duplicate-imports': [
        'warn',
        {
          allowSeparateTypeImports: true,
        },
      ],

      'no-explicit-any': 'error',

      'no-magic-numbers': 'off',

      'no-ternary': 'off',

      'sort-imports': 'off',

      'sort-keys': 'off',

      'typescript/consistent-type-definitions': ['warn', 'type'],
      'unicorn/no-null': 'off',
      'vitest/no-importing-vitest-globals': 'off',
      'vitest/prefer-importing-vitest-globals': 'off',
      'vitest/prefer-strict-boolean-matchers': 'off',
    },
  },

  staged: {
    '*': 'vp check --fix',
  },
});
