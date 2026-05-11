import type { Options } from '../../../options.js';
import renderPackageJson from '../../../scaffold/generators/package-json.js';
import renderViteConfig from '../../../scaffold/generators/vite-config.js';
import type { Contribution, FilePlan, PkgDeps } from '../../contributors.js';
import { getSubPath } from '../../sub-paths.js';

const tsContributor = (opts: Options): Contribution => {
  if (!opts.languages.includes('typescript')) {
    return { deps: {}, files: [], postSteps: [] };
  }

  const subPath = getSubPath('typescript', opts);
  const prefix = subPath === '' ? '' : `${subPath}/`;

  const contributedDeps: PkgDeps = {
    dependencies: {},
    devDependencies: {},
    scripts: {},
  };

  const files: FilePlan[] = [
    { target: `${prefix}tsconfig.json`, template: 'ts/tsconfig.json.tmpl' },
    { target: `${prefix}src/index.ts`, template: 'ts/src/index.ts.tmpl' },
    { target: `${prefix}tests/smoke.test.ts`, template: 'ts/tests/smoke.test.ts.tmpl' },
    {
      content: renderPackageJson(opts, contributedDeps),
      raw: true,
      target: `${prefix}package.json`,
    },
    { content: renderViteConfig(opts), raw: true, target: `${prefix}vite.config.ts` },
  ];

  return {
    deps: { ts: contributedDeps },
    files,
    postSteps: [],
  };
};

export default tsContributor;
