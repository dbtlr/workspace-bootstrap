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
