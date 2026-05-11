import type { Options } from '../../options.js';
import { renderMonorepoPackageJson } from '../../scaffold/generators/monorepoPackageJson.js';
import type { Contribution, FilePlan } from '../contributors.js';

export const monorepoContributor = (opts: Options): Contribution => {
  if (opts.monorepo === 'none') {
    return { files: [], postSteps: [], deps: {} };
  }

  const files: FilePlan[] = [
    { target: 'package.json', content: renderMonorepoPackageJson(opts), raw: true },
  ];

  if (opts.monorepo === 'turbo') {
    files.push({ template: 'monorepo/turbo.json.tmpl', target: 'turbo.json' });
  } else if (opts.monorepo === 'nx') {
    files.push({ template: 'monorepo/nx.json.tmpl', target: 'nx.json' });
  }

  if (opts.packageManager === 'pnpm') {
    files.push({ template: 'monorepo/pnpm-workspace.yaml.tmpl', target: 'pnpm-workspace.yaml' });
  }

  return {
    files,
    postSteps: [],
    deps: {},
  };
};
