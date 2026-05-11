import type { Options } from '../../options.js';
import renderMonorepoPackageJson from '../../scaffold/generators/monorepo-package-json.js';
import type { Contribution, FilePlan } from '../contributors.js';

const monorepoContributor = (opts: Options): Contribution => {
  if (opts.monorepo === 'none') {
    return { deps: {}, files: [], postSteps: [] };
  }

  const files: FilePlan[] = [
    { content: renderMonorepoPackageJson(opts), raw: true, target: 'package.json' },
  ];

  if (opts.monorepo === 'turbo') {
    files.push({ target: 'turbo.json', template: 'monorepo/turbo.json.tmpl' });
  } else if (opts.monorepo === 'nx') {
    files.push({ target: 'nx.json', template: 'monorepo/nx.json.tmpl' });
  }

  if (opts.packageManager === 'pnpm') {
    files.push({ target: 'pnpm-workspace.yaml', template: 'monorepo/pnpm-workspace.yaml.tmpl' });
  }

  return {
    deps: {},
    files,
    postSteps: [],
  };
};

export default monorepoContributor;
