import type { Options } from '../../../options.js';
import type { Contribution, FilePlan } from '../../contributors.js';
import { getSubPath } from '../../sub-paths.js';

const moduleName = (name: string): string => name.replace(/-/g, '_');

const pythonContributor = (opts: Options): Contribution => {
  if (!opts.languages.includes('python')) {
    return { deps: {}, files: [], postSteps: [] };
  }

  const subPath = getSubPath('python', opts);
  const isWorkspaceLayout = subPath !== '';
  const emitWorkspaceRoot = opts.pythonWorkspace;
  const pkgName = moduleName(opts.name);

  const files: FilePlan[] = [];

  files.push({ target: 'ruff.toml', template: 'python/ruff.toml' });

  if (emitWorkspaceRoot) {
    files.push({
      target: 'pyproject.toml',
      template: 'python/workspace-pyproject.toml.tmpl',
    });
  }

  const pkgPath = isWorkspaceLayout ? `${subPath}/` : '';
  files.push(
    { target: `${pkgPath}pyproject.toml`, template: 'python/pyproject.toml.tmpl' },
    {
      target: `${pkgPath}src/${pkgName}/__init__.py`,
      template: 'python/package/__init__.py.tmpl',
    },
    {
      target: `${pkgPath}tests/test_smoke.py`,
      template: 'python/tests/test_smoke.py.tmpl',
    },
  );

  if (emitWorkspaceRoot && !isWorkspaceLayout) {
    throw new Error('Internal: pythonWorkspace=true with no sub-path');
  }

  return {
    deps: {},
    files,
    postSteps: [],
  };
};

export default pythonContributor;
