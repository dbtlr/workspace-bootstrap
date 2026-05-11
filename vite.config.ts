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
    // Jest/* rules are off because this is a vitest project.
    rules: {
      'import/exports-last': 'off',
      'import/group-exports': 'off',
      'import/no-named-export': 'off',
      'import/no-nodejs-modules': 'off',
      'jest/max-expects': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/no-hooks': 'off',
      'jest/prefer-ending-with-an-expect': 'off',
      'jest/prefer-strict-equal': 'off',
      'jest/require-hook': 'off',
      'jest/require-top-level-describe': 'off',
      'jest/valid-expect': 'off',
      'jest/valid-title': 'off',
      'max-statements': ['warn', 20],
      'no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }],
      'no-magic-numbers': 'off',
      'no-ternary': 'off',
      'sort-imports': 'off',
      'typescript/consistent-type-definitions': ['warn', 'type'],
      'unicorn/no-null': 'off',
      'vitest/prefer-to-be-falsy': 'off',
      'vitest/prefer-to-be-truthy': 'off',
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
