import type { Options } from '../../../options.js';
import type { Contribution, FilePlan } from '../../contributors.js';
import { getSubPath } from '../../sub-paths.js';

export const rustContributor = (opts: Options): Contribution => {
  if (!opts.languages.includes('rust')) {
    return { files: [], postSteps: [], deps: {} };
  }

  const subPath = getSubPath('rust', opts);
  const isWorkspaceLayout = subPath !== '';
  const emitWorkspaceRoot = opts.rustWorkspace;

  const files: FilePlan[] = [];

  // Always emit fmt/clippy at repo root
  files.push(
    { template: 'rust/rustfmt.toml', target: 'rustfmt.toml' },
    { template: 'rust/clippy.toml', target: 'clippy.toml' },
  );

  // Optionally emit workspace-root Cargo.toml
  if (emitWorkspaceRoot) {
    files.push({ template: 'rust/workspace-Cargo.toml.tmpl', target: 'Cargo.toml' });
  }

  // Emit the crate (at root for single-crate, under crates/<name>/ otherwise)
  const cratePath = isWorkspaceLayout ? `${subPath}/` : '';
  files.push(
    { template: 'rust/Cargo.toml.tmpl', target: `${cratePath}Cargo.toml` },
    { template: 'rust/src/main.rs.tmpl', target: `${cratePath}src/main.rs` },
  );

  // Sanity check: if rustWorkspace=true the crate must be under crates/<name>/
  if (emitWorkspaceRoot && !isWorkspaceLayout) {
    throw new Error('Internal: rustWorkspace=true with no sub-path');
  }

  return {
    files,
    postSteps: [],
    deps: {},
  };
};
