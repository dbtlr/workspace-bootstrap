import type { Options } from '../../options.js';
import type { PkgDeps } from '../../plan/contributors.js';

const PNPM_VERSION = '10.0.0';
const BUN_VERSION = '1.1.0';

const baseScripts = (opts: Options): Record<string, string> => {
  const scripts: Record<string, string> = {
    build: 'vp pack',
    check: 'vp check',
    dev: 'tsx src/index.ts',
    test: 'vp test',
    'test:watch': 'vp test --watch',
  };
  if (opts.packageManager === 'bun' && (opts.bunTest === 'bun' || opts.bunTest === 'both')) {
    scripts['test:bun'] = 'bun test';
  }
  if (opts.packageManager === 'bun' && opts.bunTest === 'bun') {
    scripts.test = 'bun test';
    delete scripts['test:watch'];
  }
  return scripts;
};

const baseDeps = (): PkgDeps => ({
  dependencies: {},
  devDependencies: {
    '@types/node': '^22.0.0',
    tsx: '^4.21.0',
    typescript: '^5.9.3',
    'vite-plus': '^0.1.20',
    vitest: '^4.0.0',
  },
});

const renderPackageJson = (opts: Options, contributed: PkgDeps): string => {
  const base = baseDeps();
  const scripts = { ...baseScripts(opts), ...contributed.scripts };
  const dependencies = { ...base.dependencies, ...contributed.dependencies };
  const devDependencies = { ...base.devDependencies, ...contributed.devDependencies };

  const pkg: Record<string, unknown> = {
    dependencies,
    description: opts.description,
    devDependencies,
    name: opts.name,
    scripts,
    type: 'module',
    version: '0.0.1',
  };

  // PackageManager and engines belong on the root package.json only.
  // In monorepo mode, the monorepo root carries them; this is a workspace member.
  if (opts.monorepo === 'none') {
    pkg.packageManager =
      opts.packageManager === 'pnpm' ? `pnpm@${PNPM_VERSION}` : `bun@${BUN_VERSION}`;
    pkg.engines = { node: '>=22' };
  }

  return `${JSON.stringify(pkg, null, 2)}\n`;
};

export default renderPackageJson;
