import type { Options } from '../../../options.js';
import type { Contribution, FilePlan } from '../../contributors.js';
import { getSubPath } from '../../sub-paths.js';

const rustContributor = (opts: Options): Contribution => {
  if (!opts.languages.includes('rust')) {
    return { deps: {}, files: [], postSteps: [] };
  }

  const subPath = getSubPath('rust', opts);
  const isWorkspaceLayout = subPath !== '';
  const emitWorkspaceRoot = opts.rustWorkspace;

  const files: FilePlan[] = [];

  // Always emit fmt/clippy at repo root
  files.push(
    { target: 'rustfmt.toml', template: 'rust/rustfmt.toml' },
    { target: 'clippy.toml', template: 'rust/clippy.toml' },
  );

  // Optionally emit workspace-root Cargo.toml
  if (emitWorkspaceRoot) {
    files.push({ target: 'Cargo.toml', template: 'rust/workspace-Cargo.toml.tmpl' });
  }

  // Emit the crate (at root for single-crate, under crates/<name>/ otherwise)
  const cratePath = isWorkspaceLayout ? `${subPath}/` : '';
  files.push(
    { target: `${cratePath}Cargo.toml`, template: 'rust/Cargo.toml.tmpl' },
    { target: `${cratePath}src/main.rs`, template: 'rust/src/main.rs.tmpl' },
  );

  // Sanity check: if rustWorkspace=true the crate must be under crates/<name>/
  if (emitWorkspaceRoot && !isWorkspaceLayout) {
    throw new Error('Internal: rustWorkspace=true with no sub-path');
  }

  return {
    deps: {},
    files,
    postSteps: [],
  };
};

export default rustContributor;
