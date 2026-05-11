import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/cli.ts', 'src/index.ts'],
    dts: true,
    format: ['esm'],
    sourcemap: true,
  },
  lint: {
    ignorePatterns: ['dist/**', 'templates/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ['dist/**', 'templates/**'],
    printWidth: 100,
    singleQuote: true,
    sortImports: {
      ignoreCase: true,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      ignoreDeclarationSort: false,
    },
  },
  staged: {
    '*.{ts,tsx,js,mjs}': 'vp check --fix',
  },
  test: {
    passWithNoTests: true,
  },
});
