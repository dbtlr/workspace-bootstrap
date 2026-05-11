import type { Options } from '../../../options.js';
import type { Contribution, FilePlan } from '../../contributors.js';
import { getSubPath } from '../../sub-paths.js';

const moduleName = (name: string): string => name.replace(/-/g, '_');

export const pythonContributor = (opts: Options): Contribution => {
  if (!opts.languages.includes('python')) {
    return { files: [], postSteps: [], deps: {} };
  }

  const subPath = getSubPath('python', opts);
  const isWorkspaceLayout = subPath !== '';
  const emitWorkspaceRoot = opts.pythonWorkspace;
  const pkgName = moduleName(opts.name);

  const files: FilePlan[] = [];

  files.push({ template: 'python/ruff.toml', target: 'ruff.toml' });

  if (emitWorkspaceRoot) {
    files.push({
      template: 'python/workspace-pyproject.toml.tmpl',
      target: 'pyproject.toml',
    });
  }

  const pkgPath = isWorkspaceLayout ? `${subPath}/` : '';
  files.push(
    { template: 'python/pyproject.toml.tmpl', target: `${pkgPath}pyproject.toml` },
    {
      template: 'python/package/__init__.py.tmpl',
      target: `${pkgPath}src/${pkgName}/__init__.py`,
    },
    {
      template: 'python/tests/test_smoke.py.tmpl',
      target: `${pkgPath}tests/test_smoke.py`,
    },
  );

  if (emitWorkspaceRoot && !isWorkspaceLayout) {
    throw new Error('Internal: pythonWorkspace=true with no sub-path');
  }

  return {
    files,
    postSteps: [],
    deps: {},
  };
};
