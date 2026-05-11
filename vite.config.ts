import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ignorePatterns: ['dist/**', 'templates/**'],
    printWidth: 100,
    singleQuote: true,
    sortImports: {
      ignoreCase: true,
      ignoreDeclarationSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
    },
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
    ignorePatterns: ['dist/**', 'templates/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ['**/*.test.ts'],
        rules: {
          'max-statements': 'off',
          'vitest/no-importing-vitest-globals': 'off',
        },
      },
    ],
    plugins: ['eslint', 'typescript', 'oxc', 'import', 'unicorn', 'promise', 'node', 'vitest'],
    rules: {
      'no-ternary': 'off',
      'sort-imports': 'off',
      'no-magic-numbers': 'off',
      'import/exports-last': 'off',
      'import/group-exports': 'off',
      'import/no-named-export': 'off',
      'import/no-nodejs-modules': 'off',
      'typescript/consistent-type-definitions': ['warn', 'type'],
      'max-statements': ['warn', 20],
      'unicorn/no-null': 'off',
      'no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }],
      // This is a vitest project — turn off the jest plugin rules that bleed through.
      'jest/require-hook': 'off',
      'jest/valid-title': 'off',
      'jest/valid-expect': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/no-hooks': 'off',
      'jest/max-expects': 'off',
      'jest/prefer-strict-equal': 'off',
      'jest/prefer-ending-with-an-expect': 'off',
      // These belong to vitest plugin
      'vitest/prefer-to-be-truthy': 'off',
      'vitest/prefer-to-be-falsy': 'off',
      'jest/require-top-level-describe': 'off',
    },
  },
  pack: {
    dts: true,
    entry: ['src/cli.ts', 'src/index.ts'],
    format: ['esm'],
    sourcemap: true,
  },
  staged: {
    '*.{ts,tsx,js,mjs}': 'vp check --fix',
  },
  test: {
    passWithNoTests: true,
  },
});
