import type { Options } from '../../../options.js';
import { renderPackageJson } from '../../../scaffold/generators/packageJson.js';
import { renderViteConfig } from '../../../scaffold/generators/viteConfig.js';
import type { Contribution, FilePlan, PkgDeps } from '../../contributors.js';
import { getSubPath } from '../../sub-paths.js';

export const tsContributor = (opts: Options): Contribution => {
  if (!opts.languages.includes('typescript')) {
    return { files: [], postSteps: [], deps: {} };
  }

  const subPath = getSubPath('typescript', opts);
  const prefix = subPath === '' ? '' : `${subPath}/`;

  const contributedDeps: PkgDeps = {
    dependencies: {},
    devDependencies: {},
    scripts: {},
  };

  const files: FilePlan[] = [
    { template: 'ts/tsconfig.json.tmpl', target: `${prefix}tsconfig.json` },
    { template: 'ts/src/index.ts.tmpl', target: `${prefix}src/index.ts` },
    { template: 'ts/tests/smoke.test.ts.tmpl', target: `${prefix}tests/smoke.test.ts` },
    {
      target: `${prefix}package.json`,
      content: renderPackageJson(opts, contributedDeps),
      raw: true,
    },
    { target: `${prefix}vite.config.ts`, content: renderViteConfig(opts), raw: true },
  ];

  return {
    files,
    postSteps: [],
    deps: { ts: contributedDeps },
  };
};
