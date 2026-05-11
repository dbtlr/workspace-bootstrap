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
  `    ignorePatterns: ['dist/**'],`,
  '    options: {',
  '      typeAware: true,',
  '      typeCheck: true,',
  '    },',
  `    plugins: ['eslint', 'typescript', 'oxc', 'import', 'unicorn', 'promise', 'node', 'vitest'],`,
  '    categories: {',
  `      correctness: 'error',`,
  `      suspicious: 'error',`,
  `      perf: 'error',`,
  `      style: 'warn',`,
  `      pedantic: 'off',`,
  `      restriction: 'off',`,
  `      nursery: 'off',`,
  '    },',
  '    // jest/* rules are off because this is a vitest project.',
  '    rules: {',
  `      'import/exports-last': 'off',`,
  `      'import/group-exports': 'off',`,
  `      'import/no-named-export': 'off',`,
  `      'import/no-nodejs-modules': 'off',`,
  `      'jest/max-expects': 'off',`,
  `      'jest/no-conditional-expect': 'off',`,
  `      'jest/no-hooks': 'off',`,
  `      'jest/prefer-ending-with-an-expect': 'off',`,
  `      'jest/prefer-strict-equal': 'off',`,
  `      'jest/require-hook': 'off',`,
  `      'jest/require-top-level-describe': 'off',`,
  `      'jest/valid-expect': 'off',`,
  `      'jest/valid-title': 'off',`,
  `      'max-statements': ['warn', 20],`,
  `      'no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }],`,
  `      'no-magic-numbers': 'off',`,
  `      'no-ternary': 'off',`,
  `      'sort-imports': 'off',`,
  `      'typescript/consistent-type-definitions': ['warn', 'type'],`,
  `      'unicorn/no-null': 'off',`,
  `      'vitest/prefer-to-be-falsy': 'off',`,
  `      'vitest/prefer-to-be-truthy': 'off',`,
  '    },',
  '    overrides: [',
  '      {',
  `        files: ['**/*.test.ts'],`,
  '        rules: {',
  `          'max-statements': 'off',`,
  `          'vitest/no-importing-vitest-globals': 'off',`,
  '        },',
  '      },',
  '    ],',
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
