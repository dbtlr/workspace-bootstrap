import type { Options } from '../../options.js';

const buildBaseLines = (): string[] => [
  `import { defineConfig } from 'vite-plus';`,
  '',
  'export default defineConfig({',
  '  pack: {',
  `    entry: ['src/index.ts'],`,
  '    dts: true,',
  `    format: ['esm'],`,
  '  },',
  '  lint: {',
  '    categories: {',
  `      correctness: 'error',`,
  `      nursery: 'off',`,
  `      pedantic: 'off',`,
  `      perf: 'error',`,
  `      restriction: 'off',`,
  `      style: 'warn',`,
  `      suspicious: 'error',`,
  '    },',
  '    env: {',
  '      builtin: true,',
  '    },',
  '    ignorePatterns: [',
  `      'bun.lock',`,
  `      '.vscode',`,
  `      'node_modules',`,
  `      '.agents',`,
  `      '.codex',`,
  `      'build',`,
  `      'dist',`,
  `      '.turbo',`,
  `      '.vite-hooks',`,
  `      'coverage',`,
  `      'templates',`,
  '    ],',
  '    options: {',
  '      denyWarnings: true,',
  '      maxWarnings: 0,',
  '      typeAware: true,',
  '      typeCheck: true,',
  '    },',
  `    plugins: ['typescript', 'import', 'eslint', 'unicorn', 'oxc', 'promise', 'node', 'vitest'],`,
  '    rules: {',
  `      'capitalized-comments': 'off',`,
  `      'exports-last': 'off',`,
  `      'func-style': ['warn', 'declaration', { allowArrowFunctions: true }],`,
  `      'id-length': 'off',`,
  `      'import/group-exports': 'off',`,
  `      'import/no-named-as-default': 'off',`,
  `      'import/no-named-export': 'off',`,
  `      'import/no-nodejs-modules': 'off',`,
  `      'import/prefer-default-export': 'off',`,
  `      'jest/no-hooks': 'off',`,
  `      'jest/require-hook': 'off',`,
  `      'jest/valid-title': 'off',`,
  `      'no-continue': 'off',`,
  `      'max-expects': ['warn', { max: 10 }],`,
  `      'max-statements': ['warn', 40],`,
  `      'no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }],`,
  `      'no-explicit-any': 'error',`,
  `      'no-magic-numbers': 'off',`,
  `      'no-ternary': 'off',`,
  `      'sort-imports': 'off',`,
  `      'sort-keys': 'off',`,
  `      'typescript/consistent-type-definitions': ['warn', 'type'],`,
  `      'unicorn/no-null': 'off',`,
  `      'vitest/no-importing-vitest-globals': 'off',`,
  `      'vitest/prefer-importing-vitest-globals': 'off',`,
  `      'vitest/prefer-strict-boolean-matchers': 'off',`,
  '    },',
  '  },',
  '  fmt: {',
  '    printWidth: 100,',
  '    singleQuote: true,',
  '  },',
];

const buildStagedLines = (): string[] => [
  '  staged: {',
  `    '*.{ts,tsx,js,mjs}': 'vp check --fix',`,
  '  },',
];

const renderViteConfig = (opts: Options): string => {
  const usingVitePlus = !(opts.packageManager === 'bun' && opts.bunTest === 'bun');
  const lines = buildBaseLines();
  if (usingVitePlus) {
    lines.push(...buildStagedLines());
  }
  lines.push('});');
  lines.push('');
  return lines.join('\n');
};

export default renderViteConfig;
