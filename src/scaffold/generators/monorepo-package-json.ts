import type { Options } from '../../options.js';

const PNPM_VERSION = '10.0.0';
const BUN_VERSION = '1.1.0';
const TURBO_VERSION = '^2.3.0';
const NX_VERSION = '^20.3.0';

const renderMonorepoPackageJson = (opts: Options): string => {
  const scripts: Record<string, string> = {
    build: opts.monorepo === 'turbo' ? 'turbo run build' : 'nx run-many --target=build',
    check: opts.monorepo === 'turbo' ? 'turbo run check' : 'nx run-many --target=check',
    test: opts.monorepo === 'turbo' ? 'turbo run test' : 'nx run-many --target=test',
  };

  const devDependencies: Record<string, string> = {};
  if (opts.monorepo === 'turbo') {
    devDependencies.turbo = TURBO_VERSION;
  } else if (opts.monorepo === 'nx') {
    devDependencies.nx = NX_VERSION;
  }

  const pkg: Record<string, unknown> = {
    description: opts.description,
    devDependencies,
    engines: { node: '>=22' },
    name: opts.name,
    packageManager: opts.packageManager === 'pnpm' ? `pnpm@${PNPM_VERSION}` : `bun@${BUN_VERSION}`,
    private: true,
    scripts,
    type: 'module',
    version: '0.0.1',
  };

  // Bun uses package.json workspaces; pnpm uses pnpm-workspace.yaml.
  if (opts.packageManager === 'bun') {
    pkg.workspaces = ['apps/*', 'packages/*'];
  }

  return `${JSON.stringify(pkg, null, 2)}\n`;
};

export default renderMonorepoPackageJson;
