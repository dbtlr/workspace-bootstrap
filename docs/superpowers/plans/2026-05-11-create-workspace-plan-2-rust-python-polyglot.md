# create-workspace — Plan 2: Rust + Python + polyglot

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Rust and Python language contributors plus polyglot (multi-language) workspace support. After this plan, `npx create-workspace foo --language rust`, `--language python`, and `--language typescript --language rust` all produce working projects.

**Architecture:** Two new language contributors (`rustContributor`, `pythonContributor`) plus a new `monorepoRootContributor` for files at the repo root in monorepo mode. The TS contributor adapts to emit under `apps/<name>/` when monorepo is on. Per-language sub-paths in polyglot mode: TS → `apps/<name>/`, Rust → `crates/<name>/`, Python → `py/<name>/`. `post/install.ts` extends to `cargo fetch` and `uv sync`.

**Tech Stack:** TypeScript (no new runtime deps), Rust (cargo), Python (uv + ruff + pytest), Turborepo for polyglot orchestration.

**Out of scope for this plan:** nx + polyglot (polyglot always uses turbo for now), CI workflows, GitHub integration, the `sharedContributor` sync-I/O refactor.

**Reference:**

- [Design spec](../specs/2026-05-11-create-workspace-design.md)
- [Plan 1 (CLI foundation + TS)](./2026-05-11-create-workspace-plan-1-ts-foundation.md)

---

## Layout reference (single source of truth)

For each combination of `(language, monorepo, *Workspace, polyglot)`, here's where files land:

| Language   | Scenario                             | Sub-path           | Emit workspace root config?                                                             |
| ---------- | ------------------------------------ | ------------------ | --------------------------------------------------------------------------------------- |
| TypeScript | `monorepo: 'none'`                   | `/`                | n/a                                                                                     |
| TypeScript | `monorepo: 'turbo'` or `'nx'`        | `apps/<name>/`     | yes (root package.json with `workspaces`)                                               |
| Rust       | single, no workspace, no polyglot    | `/`                | n/a                                                                                     |
| Rust       | `rustWorkspace: true`, no polyglot   | `crates/<name>/`   | yes (root `Cargo.toml` with `[workspace]`)                                              |
| Rust       | polyglot (regardless of flag)        | `crates/<name>/`   | only if `rustWorkspace: true`                                                           |
| Python     | single, no workspace, no polyglot    | `/`                | n/a                                                                                     |
| Python     | `pythonWorkspace: true`, no polyglot | `packages/<name>/` | yes (root `pyproject.toml` workspace)                                                   |
| Python     | polyglot (regardless of flag)        | `py/<name>/`       | only if `pythonWorkspace: true`                                                         |
| (monorepo) | any `monorepo !== 'none'`            | n/a                | turbo.json (always), pnpm-workspace.yaml (pnpm only), root package.json with workspaces |

**Polyglot definition:** `opts.languages.length > 1`. Per the spec, polyglot forces `monorepo` to be `'turbo'` or `'nx'` (never `'none'`). For Plan 2, polyglot defaults to `'turbo'`; if `--monorepo nx` is set with polyglot, we still honor it but the nx config files are minimal.

**Path helper:** A small `getSubPath(language, opts)` helper centralizes this. See Task 4 for the implementation.

---

## Task 1: Gitignore fragments for Rust + Python

Add the two missing language gitignore fragments and a regression test that the shared contributor picks them up.

**Files:**

- Create: `templates/fragments/gitignore.rust`
- Create: `templates/fragments/gitignore.python`
- Modify: `src/plan/contributors/shared.test.ts` (add two test cases)
- Modify: `src/plan/contributors/shared.ts` (extend the typescript→ts special case for python, since `gitignore.python` is fine — special-case is only needed for typescript)

- [ ] **Step 1: Create `templates/fragments/gitignore.rust`**

```
target/
Cargo.lock
*.rs.bk
.cargo-ok
```

- [ ] **Step 2: Create `templates/fragments/gitignore.python`**

```
__pycache__/
*.py[cod]
*$py.class
.venv/
.python-version
.ruff_cache/
.pytest_cache/
.mypy_cache/
dist/
*.egg-info/
build/
```

- [ ] **Step 3: Extend `src/plan/contributors/shared.test.ts`**

Add these `it` blocks inside the existing `describe('sharedContributor', () => { ... })` block:

```ts
it('includes Rust gitignore entries when rust is selected', () => {
  const contribution = sharedContributor({ ...baseOptions, languages: ['rust'] });
  const gitignore = contribution.files.find((f) => f.target === '.gitignore');
  expect(gitignore?.content).toContain('target/');
  expect(gitignore?.content).toContain('Cargo.lock');
});

it('includes Python gitignore entries when python is selected', () => {
  const contribution = sharedContributor({ ...baseOptions, languages: ['python'] });
  const gitignore = contribution.files.find((f) => f.target === '.gitignore');
  expect(gitignore?.content).toContain('__pycache__/');
  expect(gitignore?.content).toContain('.venv/');
});

it('includes fragments for every selected language in polyglot mode', () => {
  const contribution = sharedContributor({
    ...baseOptions,
    languages: ['typescript', 'rust', 'python'],
    monorepo: 'turbo',
  });
  const gitignore = contribution.files.find((f) => f.target === '.gitignore');
  expect(gitignore?.content).toContain('node_modules/');
  expect(gitignore?.content).toContain('target/');
  expect(gitignore?.content).toContain('__pycache__/');
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `pnpm test src/plan/contributors/shared.test.ts`
Expected: 3 new tests FAIL (gitignore.rust and gitignore.python don't exist, so the fragments are silently skipped per the try/catch in `buildGitignore`).

- [ ] **Step 5: Verify shared.ts already handles new languages**

Open `src/plan/contributors/shared.ts`. The existing `buildGitignore` uses:

```ts
parts.push(readFragment(`gitignore.${lang === 'typescript' ? 'ts' : lang}`));
```

For Rust and Python, this resolves to `gitignore.rust` and `gitignore.python` respectively — which we just created. **No code change required in `shared.ts`.**

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm test src/plan/contributors/shared.test.ts`
Expected: all 6 tests PASS (3 existing + 3 new).

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add templates/fragments/gitignore.rust templates/fragments/gitignore.python src/plan/contributors/shared.test.ts
git commit -m "feat(plan): add Rust and Python gitignore fragments"
```

---

## Task 2: Extend `post/install.ts` for Rust + Python

`runInstall` currently only handles TypeScript (pnpm/bun). Extend it to run `cargo fetch` for Rust and `uv sync` for Python, with proper sequencing for polyglot. Add unit tests for the command-selection logic by extracting it into a pure helper.

**Files:**

- Modify: `src/post/install.ts`
- Create: `src/post/install.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/post/install.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../options.js';
import { installCommandsFor } from './install.js';

const baseOptions: Options = {
  name: 'foo',
  description: '',
  cwd: '/tmp',
  languages: ['typescript'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'none',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

describe('installCommandsFor', () => {
  it('returns pnpm install for TS+pnpm', () => {
    const cmds = installCommandsFor(baseOptions);
    expect(cmds).toEqual([
      { tool: 'pnpm', args: ['install'] },
      { tool: 'pnpm', args: ['exec', 'vp', 'config'] },
    ]);
  });

  it('returns bun install for TS+bun (vitest)', () => {
    const cmds = installCommandsFor({ ...baseOptions, packageManager: 'bun' });
    expect(cmds).toEqual([
      { tool: 'bun', args: ['install'] },
      { tool: 'bun', args: ['exec', 'vp', 'config'] },
    ]);
  });

  it('omits vp config when bunTest is bun-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, packageManager: 'bun', bunTest: 'bun' });
    expect(cmds).toEqual([{ tool: 'bun', args: ['install'] }]);
  });

  it('returns cargo fetch for Rust-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, languages: ['rust'] });
    expect(cmds).toEqual([{ tool: 'cargo', args: ['fetch'] }]);
  });

  it('returns uv sync for Python-only', () => {
    const cmds = installCommandsFor({ ...baseOptions, languages: ['python'] });
    expect(cmds).toEqual([{ tool: 'uv', args: ['sync'] }]);
  });

  it('chains pnpm install + cargo fetch + uv sync for full polyglot', () => {
    const cmds = installCommandsFor({
      ...baseOptions,
      languages: ['typescript', 'rust', 'python'],
      monorepo: 'turbo',
    });
    expect(cmds).toEqual([
      { tool: 'pnpm', args: ['install'] },
      { tool: 'pnpm', args: ['exec', 'vp', 'config'] },
      { tool: 'cargo', args: ['fetch'] },
      { tool: 'uv', args: ['sync'] },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/post/install.test.ts`
Expected: FAIL — `installCommandsFor` does not exist yet.

- [ ] **Step 3: Replace `src/post/install.ts`**

```ts
import type { Options } from '../options.js';
import { exec, which } from '../util/exec.js';
import type { Logger } from '../util/log.js';

export type InstallCommand = { tool: string; args: string[] };

export const installCommandsFor = (opts: Options): InstallCommand[] => {
  const cmds: InstallCommand[] = [];

  if (opts.languages.includes('typescript')) {
    const pm = opts.packageManager;
    cmds.push({ tool: pm, args: ['install'] });
    const usingVitePlus = !(pm === 'bun' && opts.bunTest === 'bun');
    if (usingVitePlus) {
      cmds.push({ tool: pm, args: ['exec', 'vp', 'config'] });
    }
  }

  if (opts.languages.includes('rust')) {
    cmds.push({ tool: 'cargo', args: ['fetch'] });
  }

  if (opts.languages.includes('python')) {
    cmds.push({ tool: 'uv', args: ['sync'] });
  }

  return cmds;
};

export const runInstall = async (targetDir: string, opts: Options, log: Logger): Promise<void> => {
  const cmds = installCommandsFor(opts);
  if (cmds.length === 0) {
    log.debug('No install commands for selected languages.');
    return;
  }

  for (const { tool, args } of cmds) {
    if (!(await which(tool))) {
      log.warn(
        `${tool} not found on PATH — skipping \`${tool} ${args.join(' ')}\`. Run it manually.`,
      );
      continue;
    }
    log.info(`Running ${tool} ${args.join(' ')}…`);
    const result = await exec(tool, args, { cwd: targetDir, inherit: true });
    if (result.code !== 0) {
      log.error(`${tool} ${args.join(' ')} failed (exit ${result.code}).`);
      return;
    }
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/post/install.test.ts`
Expected: 6 tests PASS.

Run: `pnpm test`
Expected: all PASS, no regressions.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/post/install.ts src/post/install.test.ts
git commit -m "feat(post): extend install for Rust + Python with command sequencer"
```

---

## Task 3: Rust templates

Create the static Rust template files. Some are .tmpl (interpolated), others are static (.toml configs).

**Files:**

- Create: `templates/rust/Cargo.toml.tmpl` (single-crate root or workspace-member Cargo.toml)
- Create: `templates/rust/workspace-Cargo.toml.tmpl` (workspace root Cargo.toml)
- Create: `templates/rust/src/main.rs.tmpl`
- Create: `templates/rust/rustfmt.toml`
- Create: `templates/rust/clippy.toml`

- [ ] **Step 1: Create `templates/rust/Cargo.toml.tmpl`**

This is used for both single-crate (at repo root) and workspace-member (under `crates/<name>/`). The content is identical in both cases — just the `[package]` block. Workspace lints are configured separately in workspace-Cargo.toml.tmpl.

```toml
[package]
name = "<%= it.name %>"
version = "0.0.1"
edition = "2021"
description = "<%= it.description %>"

[dependencies]
```

- [ ] **Step 2: Create `templates/rust/workspace-Cargo.toml.tmpl`**

Used at the repo root in workspace mode. Lists the single sample crate; user can add more.

```toml
[workspace]
resolver = "2"
members = ["crates/<%= it.name %>"]

[workspace.package]
edition = "2021"
version = "0.0.1"

[workspace.lints.clippy]
all = "warn"
```

- [ ] **Step 3: Create `templates/rust/src/main.rs.tmpl`**

```rust
fn main() {
    println!("Hello from <%= it.name %>!");
}
```

- [ ] **Step 4: Create `templates/rust/rustfmt.toml`**

```toml
edition = "2021"
max_width = 100
use_field_init_shorthand = true
```

- [ ] **Step 5: Create `templates/rust/clippy.toml`**

```toml
msrv = "1.83"
```

- [ ] **Step 6: Verify the templates are picked up by the existing test infrastructure**

These templates aren't used yet — they're consumed by the rust contributor in Task 4. There's nothing to test here. Skip to commit.

- [ ] **Step 7: Run `pnpm check` to confirm nothing breaks**

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add templates/rust/
git commit -m "feat(plan): add Rust templates (single crate, workspace, fmt, clippy)"
```

---

## Task 4: Rust contributor

The contributor that wires Rust templates into the plan. Handles three modes: single-crate (root), Rust workspace, and polyglot. Adds a `getSubPath` helper that other contributors will reuse.

**Files:**

- Create: `src/plan/sub-paths.ts` (new shared helper for computing per-language sub-paths)
- Create: `src/plan/sub-paths.test.ts`
- Create: `src/plan/contributors/languages/rust.ts`
- Create: `src/plan/contributors/languages/rust.test.ts`

- [ ] **Step 1: Write the failing test for sub-paths**

Create `src/plan/sub-paths.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../options.js';
import { getSubPath, isPolyglot } from './sub-paths.js';

const baseOptions: Options = {
  name: 'foo',
  description: '',
  cwd: '/tmp',
  languages: ['typescript'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'none',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

describe('isPolyglot', () => {
  it('returns false for single language', () => {
    expect(isPolyglot(baseOptions)).toBe(false);
  });

  it('returns true for 2+ languages', () => {
    expect(isPolyglot({ ...baseOptions, languages: ['typescript', 'rust'] })).toBe(true);
  });
});

describe('getSubPath', () => {
  it('returns empty string for TS without monorepo', () => {
    expect(getSubPath('typescript', baseOptions)).toBe('');
  });

  it('returns apps/<name> for TS in monorepo', () => {
    expect(getSubPath('typescript', { ...baseOptions, monorepo: 'turbo' })).toBe('apps/foo');
  });

  it('returns empty string for Rust without workspace and not polyglot', () => {
    expect(getSubPath('rust', { ...baseOptions, languages: ['rust'] })).toBe('');
  });

  it('returns crates/<name> for Rust with workspace', () => {
    expect(getSubPath('rust', { ...baseOptions, languages: ['rust'], rustWorkspace: true })).toBe(
      'crates/foo',
    );
  });

  it('returns crates/<name> for Rust in polyglot', () => {
    expect(
      getSubPath('rust', {
        ...baseOptions,
        languages: ['typescript', 'rust'],
        monorepo: 'turbo',
      }),
    ).toBe('crates/foo');
  });

  it('returns empty string for Python without workspace and not polyglot', () => {
    expect(getSubPath('python', { ...baseOptions, languages: ['python'] })).toBe('');
  });

  it('returns packages/<name> for Python with workspace', () => {
    expect(
      getSubPath('python', { ...baseOptions, languages: ['python'], pythonWorkspace: true }),
    ).toBe('packages/foo');
  });

  it('returns py/<name> for Python in polyglot', () => {
    expect(
      getSubPath('python', {
        ...baseOptions,
        languages: ['typescript', 'python'],
        monorepo: 'turbo',
      }),
    ).toBe('py/foo');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/plan/sub-paths.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/plan/sub-paths.ts`**

```ts
import type { Language, Options } from '../options.js';

export const isPolyglot = (opts: Options): boolean => opts.languages.length > 1;

export const getSubPath = (lang: Language, opts: Options): string => {
  const polyglot = isPolyglot(opts);

  if (lang === 'typescript') {
    if (opts.monorepo === 'none') return '';
    return `apps/${opts.name}`;
  }

  if (lang === 'rust') {
    if (polyglot) return `crates/${opts.name}`;
    if (opts.rustWorkspace) return `crates/${opts.name}`;
    return '';
  }

  if (lang === 'python') {
    if (polyglot) return `py/${opts.name}`;
    if (opts.pythonWorkspace) return `packages/${opts.name}`;
    return '';
  }

  return '';
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/plan/sub-paths.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Write the failing test for rustContributor**

Create `src/plan/contributors/languages/rust.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../../../options.js';
import { rustContributor } from './rust.js';

const baseOptions: Options = {
  name: 'foo',
  description: '',
  cwd: '/tmp',
  languages: ['rust'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'none',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

describe('rustContributor', () => {
  it('returns empty contribution when rust is not in languages', () => {
    const contribution = rustContributor({ ...baseOptions, languages: ['typescript'] });
    expect(contribution.files).toHaveLength(0);
  });

  it('contributes Cargo.toml + src/main.rs + rustfmt + clippy at root for single-crate', () => {
    const contribution = rustContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('Cargo.toml');
    expect(targets).toContain('src/main.rs');
    expect(targets).toContain('rustfmt.toml');
    expect(targets).toContain('clippy.toml');
    expect(targets).not.toContain('crates/foo/Cargo.toml');
  });

  it('contributes workspace Cargo.toml + crates/<name>/ when rustWorkspace is true', () => {
    const contribution = rustContributor({ ...baseOptions, rustWorkspace: true });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('Cargo.toml'); // workspace root
    expect(targets).toContain('crates/foo/Cargo.toml');
    expect(targets).toContain('crates/foo/src/main.rs');
    expect(targets).toContain('rustfmt.toml');
    expect(targets).toContain('clippy.toml');
  });

  it('emits the workspace-Cargo.toml template at root when rustWorkspace is true', () => {
    const contribution = rustContributor({ ...baseOptions, rustWorkspace: true });
    const rootCargo = contribution.files.find((f) => f.target === 'Cargo.toml');
    expect(rootCargo?.template).toBe('rust/workspace-Cargo.toml.tmpl');
  });

  it('contributes crates/<name>/ in polyglot mode without workspace flag', () => {
    const polyglotOpts: Options = {
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
    };
    const contribution = rustContributor(polyglotOpts);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('crates/foo/Cargo.toml');
    expect(targets).toContain('crates/foo/src/main.rs');
    expect(targets).not.toContain('Cargo.toml'); // no workspace root because rustWorkspace is false
  });

  it('emits both crates/<name>/ AND workspace root in polyglot + rustWorkspace mode', () => {
    const polyglotOpts: Options = {
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
      rustWorkspace: true,
    };
    const contribution = rustContributor(polyglotOpts);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('Cargo.toml');
    expect(targets).toContain('crates/foo/Cargo.toml');
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm test src/plan/contributors/languages/rust.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `src/plan/contributors/languages/rust.ts`**

```ts
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
  // (otherwise the crate Cargo.toml collides with the workspace Cargo.toml).
  // getSubPath enforces this, but assert as defense in depth.
  if (emitWorkspaceRoot && !isWorkspaceLayout) {
    throw new Error('Internal: rustWorkspace=true with no sub-path');
  }

  return {
    files,
    postSteps: [],
    deps: {},
  };
};
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm test src/plan/contributors/languages/rust.test.ts`
Expected: 6 tests PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/plan/sub-paths.ts src/plan/sub-paths.test.ts src/plan/contributors/languages/rust.ts src/plan/contributors/languages/rust.test.ts
git commit -m "feat(plan): add Rust contributor with single/workspace/polyglot modes"
```

---

## Task 5: Python templates

Create Python template files: pyproject.toml (single + workspace variants), ruff.toml, sample package, smoke test.

**Files:**

- Create: `templates/python/pyproject.toml.tmpl` (single-package or workspace-member)
- Create: `templates/python/workspace-pyproject.toml.tmpl` (uv workspace root)
- Create: `templates/python/ruff.toml`
- Create: `templates/python/package/__init__.py.tmpl`
- Create: `templates/python/tests/test_smoke.py.tmpl`

- [ ] **Step 1: Create `templates/python/pyproject.toml.tmpl`**

Used for both single-package (at root) and workspace-member (under `packages/<name>/` or `py/<name>/`). Has `[project]` metadata and uv-managed dev deps.

```toml
[project]
name = "<%= it.name.replace(/-/g, '_') %>"
version = "0.0.1"
description = "<%= it.description %>"
readme = "README.md"
requires-python = ">=3.13"
dependencies = []

[dependency-groups]
dev = ["pytest>=8.0.0", "ruff>=0.7.0"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/<%= it.name.replace(/-/g, '_') %>"]
```

**Note on `name`:** Python package names use underscores, not hyphens. We convert `it.name`'s hyphens to underscores for the Python module name. The `[project] name` field can use either, but to keep consistency, we use the underscore form everywhere on the Python side.

- [ ] **Step 2: Create `templates/python/workspace-pyproject.toml.tmpl`**

Used at the repo root in workspace mode. Defines a uv workspace with one sample member.

```toml
[project]
name = "<%= it.name.replace(/-/g, '_') %>_workspace"
version = "0.0.1"
description = "<%= it.description %>"
requires-python = ">=3.13"

[tool.uv.workspace]
members = ["packages/*"]
```

- [ ] **Step 3: Create `templates/python/ruff.toml`**

```toml
target-version = "py313"
line-length = 100

[lint]
select = ["E", "F", "I", "N", "W", "UP", "B", "SIM", "RUF"]
ignore = []

[format]
quote-style = "double"
indent-style = "space"
```

- [ ] **Step 4: Create `templates/python/package/__init__.py.tmpl`**

```python
"""<%= it.description %>"""

__version__ = "0.0.1"


def greet(name: str) -> str:
    """Return a greeting."""
    return f"Hello, {name}!"
```

- [ ] **Step 5: Create `templates/python/tests/test_smoke.py.tmpl`**

```python
from <%= it.name.replace(/-/g, '_') %> import greet


def test_greet() -> None:
    assert greet("world") == "Hello, world!"
```

- [ ] **Step 6: Run `pnpm check`**

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add templates/python/
git commit -m "feat(plan): add Python templates (single + workspace, ruff, pytest)"
```

---

## Task 6: Python contributor

Implements the Python contributor with single-package, uv-workspace, and polyglot modes.

**Files:**

- Create: `src/plan/contributors/languages/python.ts`
- Create: `src/plan/contributors/languages/python.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/plan/contributors/languages/python.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../../../options.js';
import { pythonContributor } from './python.js';

const baseOptions: Options = {
  name: 'foo',
  description: '',
  cwd: '/tmp',
  languages: ['python'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'none',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

describe('pythonContributor', () => {
  it('returns empty contribution when python is not in languages', () => {
    const contribution = pythonContributor({ ...baseOptions, languages: ['rust'] });
    expect(contribution.files).toHaveLength(0);
  });

  it('contributes pyproject + ruff + __init__ + tests at root for single-package', () => {
    const contribution = pythonContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('pyproject.toml');
    expect(targets).toContain('ruff.toml');
    expect(targets).toContain('src/foo/__init__.py');
    expect(targets).toContain('tests/test_smoke.py');
  });

  it('uses underscored package name for hyphenated project names', () => {
    const contribution = pythonContributor({ ...baseOptions, name: 'my-app' });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('src/my_app/__init__.py');
  });

  it('emits workspace root + packages/<name>/ when pythonWorkspace is true', () => {
    const contribution = pythonContributor({ ...baseOptions, pythonWorkspace: true });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('pyproject.toml'); // workspace root
    expect(targets).toContain('packages/foo/pyproject.toml');
    expect(targets).toContain('packages/foo/src/foo/__init__.py');
    expect(targets).toContain('packages/foo/tests/test_smoke.py');
  });

  it('emits the workspace-pyproject template at root when pythonWorkspace is true', () => {
    const contribution = pythonContributor({ ...baseOptions, pythonWorkspace: true });
    const rootPyproject = contribution.files.find((f) => f.target === 'pyproject.toml');
    expect(rootPyproject?.template).toBe('python/workspace-pyproject.toml.tmpl');
  });

  it('contributes py/<name>/ in polyglot mode without workspace flag', () => {
    const polyglotOpts: Options = {
      ...baseOptions,
      languages: ['typescript', 'python'],
      monorepo: 'turbo',
    };
    const contribution = pythonContributor(polyglotOpts);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('py/foo/pyproject.toml');
    expect(targets).toContain('py/foo/src/foo/__init__.py');
    expect(targets).not.toContain('pyproject.toml'); // no workspace root because pythonWorkspace is false
  });

  it('emits both py/<name>/ AND workspace root in polyglot + pythonWorkspace mode', () => {
    const polyglotOpts: Options = {
      ...baseOptions,
      languages: ['typescript', 'python'],
      monorepo: 'turbo',
      pythonWorkspace: true,
    };
    const contribution = pythonContributor(polyglotOpts);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('pyproject.toml');
    expect(targets).toContain('py/foo/pyproject.toml');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/plan/contributors/languages/python.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/plan/contributors/languages/python.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/plan/contributors/languages/python.test.ts`
Expected: 7 tests PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plan/contributors/languages/python.ts src/plan/contributors/languages/python.test.ts
git commit -m "feat(plan): add Python contributor with single/workspace/polyglot modes"
```

---

## Task 7: Monorepo root contributor

When `opts.monorepo !== 'none'`, emit root-level monorepo orchestration files: `turbo.json` (or `nx.json`), root `package.json` (with `workspaces`), and `pnpm-workspace.yaml` (if pnpm).

**Files:**

- Create: `templates/monorepo/turbo.json.tmpl`
- Create: `templates/monorepo/nx.json.tmpl`
- Create: `templates/monorepo/pnpm-workspace.yaml.tmpl`
- Create: `src/scaffold/generators/monorepoPackageJson.ts`
- Create: `src/scaffold/generators/monorepoPackageJson.test.ts`
- Create: `src/plan/contributors/monorepo.ts`
- Create: `src/plan/contributors/monorepo.test.ts`

- [ ] **Step 1: Create `templates/monorepo/turbo.json.tmpl`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "target/**"]
    },
    "check": {
      "dependsOn": []
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 2: Create `templates/monorepo/nx.json.tmpl`**

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*"],
    "production": ["default", "!{projectRoot}/**/*.test.ts", "!{projectRoot}/tests/**/*"]
  },
  "targetDefaults": {
    "build": {
      "inputs": ["production", "^production"],
      "outputs": ["{projectRoot}/dist", "{projectRoot}/target"]
    },
    "test": {
      "inputs": ["default", "^production"]
    }
  }
}
```

- [ ] **Step 3: Create `templates/monorepo/pnpm-workspace.yaml.tmpl`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 4: Write the failing test for `monorepoPackageJson`**

Create `src/scaffold/generators/monorepoPackageJson.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../../options.js';
import { renderMonorepoPackageJson } from './monorepoPackageJson.js';

const baseOptions: Options = {
  name: 'my-mono',
  description: 'Polyglot project',
  cwd: '/tmp',
  languages: ['typescript', 'rust'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'turbo',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

describe('renderMonorepoPackageJson', () => {
  it('emits a name and private:true', () => {
    const json = renderMonorepoPackageJson(baseOptions);
    const parsed = JSON.parse(json) as { name: string; private: boolean };
    expect(parsed.name).toBe('my-mono');
    expect(parsed.private).toBe(true);
  });

  it('includes a workspaces array for bun', () => {
    const json = renderMonorepoPackageJson({ ...baseOptions, packageManager: 'bun' });
    const parsed = JSON.parse(json) as { workspaces: string[] };
    expect(parsed.workspaces).toEqual(['apps/*', 'packages/*']);
  });

  it('omits workspaces for pnpm (since pnpm-workspace.yaml is separate)', () => {
    const json = renderMonorepoPackageJson(baseOptions);
    const parsed = JSON.parse(json) as { workspaces?: string[] };
    expect(parsed.workspaces).toBeUndefined();
  });

  it('includes turbo as a devDependency when monorepo is turbo', () => {
    const json = renderMonorepoPackageJson(baseOptions);
    const parsed = JSON.parse(json) as { devDependencies: Record<string, string> };
    expect(parsed.devDependencies.turbo).toBeDefined();
  });

  it('includes nx as a devDependency when monorepo is nx', () => {
    const json = renderMonorepoPackageJson({ ...baseOptions, monorepo: 'nx' });
    const parsed = JSON.parse(json) as { devDependencies: Record<string, string> };
    expect(parsed.devDependencies.nx).toBeDefined();
    expect(parsed.devDependencies.turbo).toBeUndefined();
  });

  it('sets packageManager based on options', () => {
    const pnpm = JSON.parse(renderMonorepoPackageJson(baseOptions)) as { packageManager: string };
    expect(pnpm.packageManager).toMatch(/^pnpm@/);
    const bun = JSON.parse(
      renderMonorepoPackageJson({ ...baseOptions, packageManager: 'bun' }),
    ) as { packageManager: string };
    expect(bun.packageManager).toMatch(/^bun@/);
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `pnpm test src/scaffold/generators/monorepoPackageJson.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `src/scaffold/generators/monorepoPackageJson.ts`**

```ts
import type { Options } from '../../options.js';

const PNPM_VERSION = '10.0.0';
const BUN_VERSION = '1.1.0';
const TURBO_VERSION = '^2.3.0';
const NX_VERSION = '^20.3.0';

export const renderMonorepoPackageJson = (opts: Options): string => {
  const scripts: Record<string, string> = {
    build: opts.monorepo === 'turbo' ? 'turbo run build' : 'nx run-many --target=build',
    test: opts.monorepo === 'turbo' ? 'turbo run test' : 'nx run-many --target=test',
    check: opts.monorepo === 'turbo' ? 'turbo run check' : 'nx run-many --target=check',
  };

  const devDependencies: Record<string, string> = {};
  if (opts.monorepo === 'turbo') {
    devDependencies.turbo = TURBO_VERSION;
  } else if (opts.monorepo === 'nx') {
    devDependencies.nx = NX_VERSION;
  }

  const pkg: Record<string, unknown> = {
    name: opts.name,
    version: '0.0.1',
    description: opts.description,
    private: true,
    type: 'module',
    scripts,
    devDependencies,
    packageManager: opts.packageManager === 'pnpm' ? `pnpm@${PNPM_VERSION}` : `bun@${BUN_VERSION}`,
    engines: { node: '>=22' },
  };

  // Bun uses package.json workspaces; pnpm uses pnpm-workspace.yaml.
  if (opts.packageManager === 'bun') {
    pkg.workspaces = ['apps/*', 'packages/*'];
  }

  return `${JSON.stringify(pkg, null, 2)}\n`;
};
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm test src/scaffold/generators/monorepoPackageJson.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 8: Write the failing test for monorepoContributor**

Create `src/plan/contributors/monorepo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../../options.js';
import { monorepoContributor } from './monorepo.js';

const baseOptions: Options = {
  name: 'foo',
  description: '',
  cwd: '/tmp',
  languages: ['typescript'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'none',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

describe('monorepoContributor', () => {
  it('returns empty when monorepo is none', () => {
    const contribution = monorepoContributor(baseOptions);
    expect(contribution.files).toHaveLength(0);
  });

  it('emits turbo.json + root package.json + pnpm-workspace.yaml for turbo + pnpm', () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: 'turbo' });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('turbo.json');
    expect(targets).toContain('package.json');
    expect(targets).toContain('pnpm-workspace.yaml');
  });

  it('omits pnpm-workspace.yaml when packageManager is bun', () => {
    const contribution = monorepoContributor({
      ...baseOptions,
      monorepo: 'turbo',
      packageManager: 'bun',
    });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('turbo.json');
    expect(targets).toContain('package.json');
    expect(targets).not.toContain('pnpm-workspace.yaml');
  });

  it('emits nx.json for nx mode', () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: 'nx' });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('nx.json');
    expect(targets).not.toContain('turbo.json');
  });

  it('root package.json is generated content (not a template)', () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: 'turbo' });
    const pkg = contribution.files.find((f) => f.target === 'package.json');
    expect(pkg?.content).toBeDefined();
    expect(pkg?.raw).toBe(true);
  });
});
```

- [ ] **Step 9: Run the test to verify it fails**

Run: `pnpm test src/plan/contributors/monorepo.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 10: Implement `src/plan/contributors/monorepo.ts`**

```ts
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
```

- [ ] **Step 11: Run the tests to verify they pass**

Run: `pnpm test src/plan/contributors/monorepo.test.ts`
Expected: 5 tests PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add templates/monorepo/ src/scaffold/generators/monorepoPackageJson.ts src/scaffold/generators/monorepoPackageJson.test.ts src/plan/contributors/monorepo.ts src/plan/contributors/monorepo.test.ts
git commit -m "feat(plan): add monorepo root contributor (turbo|nx + workspaces)"
```

---

## Task 8: TS contributor — monorepo adaptation

Update `tsContributor` so that when `opts.monorepo !== 'none'`, files emit under `apps/<name>/` instead of root. Update existing tests; add new ones for the monorepo case.

**Files:**

- Modify: `src/plan/contributors/languages/ts.ts`
- Modify: `src/plan/contributors/languages/ts.test.ts`
- Modify: `src/scaffold/generators/packageJson.ts` — emit `packageManager` only when at repo root (i.e., not in monorepo); when in monorepo, the root package.json carries `packageManager`, so app package.json should NOT.

- [ ] **Step 1: Extend `src/plan/contributors/languages/ts.test.ts`**

Add these `it` blocks inside the existing `describe('tsContributor', () => { ... })` block (after the existing tests, do not modify them):

```ts
it('emits files under apps/<name>/ when monorepo is turbo', () => {
  const contribution = tsContributor({ ...baseOptions, monorepo: 'turbo' });
  const targets = contribution.files.map((f) => f.target);
  expect(targets).toContain('apps/foo/tsconfig.json');
  expect(targets).toContain('apps/foo/.oxlintrc.json');
  expect(targets).toContain('apps/foo/.oxfmtrc.json');
  expect(targets).toContain('apps/foo/package.json');
  expect(targets).toContain('apps/foo/vite.config.ts');
  expect(targets).toContain('apps/foo/src/index.ts');
  expect(targets).toContain('apps/foo/tests/smoke.test.ts');
});

it('does not emit packageManager field when in monorepo mode', () => {
  const contribution = tsContributor({ ...baseOptions, monorepo: 'turbo' });
  const pkg = contribution.files.find((f) => f.target === 'apps/foo/package.json');
  const parsed = JSON.parse(pkg?.content ?? '{}') as { packageManager?: string };
  expect(parsed.packageManager).toBeUndefined();
});

it('emits packageManager field when not in monorepo mode', () => {
  const contribution = tsContributor(baseOptions);
  const pkg = contribution.files.find((f) => f.target === 'package.json');
  const parsed = JSON.parse(pkg?.content ?? '{}') as { packageManager?: string };
  expect(parsed.packageManager).toMatch(/^pnpm@/);
});

it('also emits files under apps/<name>/ for nx mode', () => {
  const contribution = tsContributor({ ...baseOptions, monorepo: 'nx' });
  const targets = contribution.files.map((f) => f.target);
  expect(targets).toContain('apps/foo/tsconfig.json');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/plan/contributors/languages/ts.test.ts`
Expected: 4 new tests FAIL (current ts.ts doesn't use sub-path; packageJson generator always sets packageManager).

- [ ] **Step 3: Update `src/scaffold/generators/packageJson.ts`**

Modify the `renderPackageJson` function so that `packageManager` is only included when NOT in monorepo mode (i.e., when this is the root package.json). The minimal diff: change the line that sets `packageManager` to be conditional.

Replace the existing `renderPackageJson` function body with:

```ts
export const renderPackageJson = (opts: Options, contributed: PkgDeps): string => {
  const base = baseDeps();
  const scripts = { ...baseScripts(opts), ...contributed.scripts };
  const dependencies = { ...base.dependencies, ...contributed.dependencies };
  const devDependencies = { ...base.devDependencies, ...contributed.devDependencies };

  const pkg: Record<string, unknown> = {
    name: opts.name,
    version: '0.0.1',
    description: opts.description,
    type: 'module',
    scripts,
    dependencies,
    devDependencies,
  };

  // packageManager and engines belong on the root package.json only.
  // In monorepo mode, the monorepo root carries them; this is a workspace member.
  if (opts.monorepo === 'none') {
    pkg.packageManager =
      opts.packageManager === 'pnpm' ? `pnpm@${PNPM_VERSION}` : `bun@${BUN_VERSION}`;
    pkg.engines = { node: '>=22' };
  }

  return `${JSON.stringify(pkg, null, 2)}\n`;
};
```

- [ ] **Step 4: Update `src/plan/contributors/languages/ts.ts`**

Replace `tsContributor` with the sub-path-aware version:

```ts
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
    { template: 'ts/.oxlintrc.json', target: `${prefix}.oxlintrc.json` },
    { template: 'ts/.oxfmtrc.json', target: `${prefix}.oxfmtrc.json` },
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test src/plan/contributors/languages/ts.test.ts`
Expected: all tests PASS (existing 3 + new 4 = 7).

Run: `pnpm test src/scaffold/generators/packageJson.test.ts`
Expected: PASS — existing tests should still pass since they all use `monorepo: 'none'` in their fixtures.

Run: `pnpm test`
Expected: full suite PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plan/contributors/languages/ts.ts src/plan/contributors/languages/ts.test.ts src/scaffold/generators/packageJson.ts
git commit -m "feat(plan): TS contributor emits under apps/<name>/ in monorepo mode"
```

---

## Task 9: Wire contributors into `run.ts` + applyDefaults + end-to-end tests

Final wiring: add `rustContributor`, `pythonContributor`, and `monorepoContributor` to the contributor list. Update `applyDefaults` so polyglot forces monorepo to `'turbo'`. Add end-to-end integration tests for rust-only, python-only, TS+Rust polyglot, and TS+Rust+Python polyglot.

**Files:**

- Modify: `src/run.ts`
- Modify: `src/prompts/questions.ts`
- Modify: `src/prompts/questions.test.ts`
- Create: `tests/integration/rust-end-to-end.test.ts`
- Create: `tests/integration/python-end-to-end.test.ts`
- Create: `tests/integration/polyglot-end-to-end.test.ts`

- [ ] **Step 1: Update `src/run.ts` to include all contributors**

In `src/run.ts`, modify the `buildPlan` call to include the new contributors. Also import them:

```ts
// at the top, with existing imports
import { monorepoContributor } from './plan/contributors/monorepo.js';
import { pythonContributor } from './plan/contributors/languages/python.js';
import { rustContributor } from './plan/contributors/languages/rust.js';
```

And update the `buildPlan` line:

```ts
const plan = buildPlan(opts, [
  sharedContributor,
  monorepoContributor,
  tsContributor,
  rustContributor,
  pythonContributor,
]);
```

The order matters: `sharedContributor` produces top-level shared files (README, AGENTS, .gitignore, etc.). `monorepoContributor` produces top-level monorepo orchestration files. Language contributors produce their own files (in sub-paths in monorepo mode). No file collisions, but the order documents the intent.

- [ ] **Step 2: Update `src/prompts/questions.ts` to force monorepo in polyglot mode**

Modify `applyDefaults` to force monorepo to `'turbo'` if polyglot AND partial doesn't specify a monorepo. Critically, this must override `monorepo: 'none'` (from partial) when polyglot — polyglot ALWAYS requires a monorepo per the spec.

Replace `applyDefaults` with:

```ts
export const applyDefaults = (partial: PartialOptions): PartialOptions => {
  const isPolyglot = (partial.languages?.length ?? 0) > 1;
  const monorepoDefault = isPolyglot ? 'turbo' : 'none';

  const filled: PartialOptions = {
    description: '',
    monorepo: monorepoDefault,
    packageManager: 'pnpm',
    bunTest: 'vitest',
    rustWorkspace: false,
    pythonWorkspace: false,
    ci: false,
    github: false,
    githubVisibility: 'private',
    git: true,
    commit: true,
    install: true,
    verbose: false,
    ...partial,
  };

  // Polyglot forces a monorepo. If partial explicitly sets monorepo: 'none' with polyglot,
  // override it to the default. This is the one place we override an explicit value.
  if (isPolyglot && filled.monorepo === 'none') {
    filled.monorepo = 'turbo';
  }

  return filled;
};
```

- [ ] **Step 3: Update `src/prompts/questions.test.ts`**

Add these `it` blocks inside the existing `describe('applyDefaults', () => { ... })` block:

```ts
it('overrides monorepo: none to turbo when polyglot', () => {
  const out = applyDefaults({
    cwd: '/tmp',
    languages: ['typescript', 'rust'],
    monorepo: 'none',
  });
  expect(out.monorepo).toBe('turbo');
});

it('preserves monorepo: nx for polyglot when explicitly set', () => {
  const out = applyDefaults({
    cwd: '/tmp',
    languages: ['typescript', 'rust'],
    monorepo: 'nx',
  });
  expect(out.monorepo).toBe('nx');
});
```

- [ ] **Step 4: Run prompts tests**

Run: `pnpm test src/prompts/questions.test.ts`
Expected: PASS (5 existing + 2 new = 7 tests).

- [ ] **Step 5: Write the failing rust integration test**

Create `tests/integration/rust-end-to-end.test.ts`:

```ts
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Options } from '../../src/options.js';
import { buildPlan } from '../../src/plan/index.js';
import { sharedContributor } from '../../src/plan/contributors/shared.js';
import { monorepoContributor } from '../../src/plan/contributors/monorepo.js';
import { rustContributor } from '../../src/plan/contributors/languages/rust.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  name: 'rusty',
  description: 'A Rust demo',
  cwd: '/tmp',
  languages: ['rust'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'none',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

const contributors = [sharedContributor, monorepoContributor, rustContributor];

describe('Rust-only end-to-end scaffold', () => {
  it('single-crate produces Cargo.toml + src/main.rs at root', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'rust-single-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    expect(existsSync(join(target, 'Cargo.toml'))).toBe(true);
    expect(existsSync(join(target, 'src/main.rs'))).toBe(true);
    expect(existsSync(join(target, 'rustfmt.toml'))).toBe(true);
    expect(existsSync(join(target, 'clippy.toml'))).toBe(true);
    expect(existsSync(join(target, 'README.md'))).toBe(true);
    expect(existsSync(join(target, 'AGENTS.md'))).toBe(true);
  });

  it('Cargo.toml has the project name interpolated', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'rust-single-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    const cargo = readFileSync(join(target, 'Cargo.toml'), 'utf8');
    expect(cargo).toContain('name = "rusty"');
  });

  it('workspace mode produces workspace Cargo.toml + crates/<name>/', async () => {
    const opts: Options = { ...baseOpts, rustWorkspace: true };
    const cwd = mkdtempSync(join(tmpdir(), 'rust-ws-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    const rootCargo = readFileSync(join(target, 'Cargo.toml'), 'utf8');
    expect(rootCargo).toContain('[workspace]');
    expect(existsSync(join(target, 'crates/rusty/Cargo.toml'))).toBe(true);
    expect(existsSync(join(target, 'crates/rusty/src/main.rs'))).toBe(true);
  });
});
```

- [ ] **Step 6: Write the python integration test**

Create `tests/integration/python-end-to-end.test.ts`:

```ts
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Options } from '../../src/options.js';
import { buildPlan } from '../../src/plan/index.js';
import { sharedContributor } from '../../src/plan/contributors/shared.js';
import { monorepoContributor } from '../../src/plan/contributors/monorepo.js';
import { pythonContributor } from '../../src/plan/contributors/languages/python.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  name: 'pythy',
  description: 'A Python demo',
  cwd: '/tmp',
  languages: ['python'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'none',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

const contributors = [sharedContributor, monorepoContributor, pythonContributor];

describe('Python-only end-to-end scaffold', () => {
  it('single-package produces pyproject + src/<name>/', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'py-single-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    expect(existsSync(join(target, 'pyproject.toml'))).toBe(true);
    expect(existsSync(join(target, 'ruff.toml'))).toBe(true);
    expect(existsSync(join(target, 'src/pythy/__init__.py'))).toBe(true);
    expect(existsSync(join(target, 'tests/test_smoke.py'))).toBe(true);
  });

  it('underscores hyphenated names in the module path', async () => {
    const opts: Options = { ...baseOpts, name: 'my-py-app' };
    const cwd = mkdtempSync(join(tmpdir(), 'py-hyphen-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    expect(existsSync(join(target, 'src/my_py_app/__init__.py'))).toBe(true);
  });

  it('workspace mode produces workspace pyproject + packages/<name>/', async () => {
    const opts: Options = { ...baseOpts, pythonWorkspace: true };
    const cwd = mkdtempSync(join(tmpdir(), 'py-ws-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    const rootPy = readFileSync(join(target, 'pyproject.toml'), 'utf8');
    expect(rootPy).toContain('[tool.uv.workspace]');
    expect(existsSync(join(target, 'packages/pythy/pyproject.toml'))).toBe(true);
    expect(existsSync(join(target, 'packages/pythy/src/pythy/__init__.py'))).toBe(true);
  });
});
```

- [ ] **Step 7: Write the polyglot integration test**

Create `tests/integration/polyglot-end-to-end.test.ts`:

```ts
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Options } from '../../src/options.js';
import { buildPlan } from '../../src/plan/index.js';
import { sharedContributor } from '../../src/plan/contributors/shared.js';
import { monorepoContributor } from '../../src/plan/contributors/monorepo.js';
import { tsContributor } from '../../src/plan/contributors/languages/ts.js';
import { rustContributor } from '../../src/plan/contributors/languages/rust.js';
import { pythonContributor } from '../../src/plan/contributors/languages/python.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  name: 'multi',
  description: 'Polyglot demo',
  cwd: '/tmp',
  languages: ['typescript', 'rust'],
  packageManager: 'pnpm',
  bunTest: 'vitest',
  monorepo: 'turbo',
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: 'private',
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

const contributors = [
  sharedContributor,
  monorepoContributor,
  tsContributor,
  rustContributor,
  pythonContributor,
];

describe('Polyglot end-to-end scaffold', () => {
  it('TS+Rust turbo produces monorepo root + apps/<name>/ + crates/<name>/', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'poly-ts-rust-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    expect(existsSync(join(target, 'turbo.json'))).toBe(true);
    expect(existsSync(join(target, 'package.json'))).toBe(true);
    expect(existsSync(join(target, 'pnpm-workspace.yaml'))).toBe(true);
    expect(existsSync(join(target, 'apps/multi/package.json'))).toBe(true);
    expect(existsSync(join(target, 'apps/multi/vite.config.ts'))).toBe(true);
    expect(existsSync(join(target, 'crates/multi/Cargo.toml'))).toBe(true);
    expect(existsSync(join(target, 'crates/multi/src/main.rs'))).toBe(true);
    expect(existsSync(join(target, 'README.md'))).toBe(true);
    expect(existsSync(join(target, 'AGENTS.md'))).toBe(true);
  });

  it('root package.json has turbo as a devDependency and is private', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'poly-ts-rust-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    const rootPkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')) as {
      name: string;
      private: boolean;
      devDependencies: Record<string, string>;
      packageManager: string;
    };
    expect(rootPkg.name).toBe('multi');
    expect(rootPkg.private).toBe(true);
    expect(rootPkg.devDependencies.turbo).toBeDefined();
    expect(rootPkg.packageManager).toMatch(/^pnpm@/);
  });

  it('app package.json does NOT include packageManager (only root does)', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'poly-ts-rust-'));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    const appPkg = JSON.parse(readFileSync(join(target, 'apps/multi/package.json'), 'utf8')) as {
      packageManager?: string;
    };
    expect(appPkg.packageManager).toBeUndefined();
  });

  it('TS+Rust+Python produces all three language sub-trees', async () => {
    const opts: Options = { ...baseOpts, languages: ['typescript', 'rust', 'python'] };
    const cwd = mkdtempSync(join(tmpdir(), 'poly-all-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    expect(existsSync(join(target, 'apps/multi/package.json'))).toBe(true);
    expect(existsSync(join(target, 'crates/multi/Cargo.toml'))).toBe(true);
    expect(existsSync(join(target, 'py/multi/pyproject.toml'))).toBe(true);
    expect(existsSync(join(target, 'py/multi/src/multi/__init__.py'))).toBe(true);
  });

  it('mise.toml includes node, rust, and python for full polyglot', async () => {
    const opts: Options = { ...baseOpts, languages: ['typescript', 'rust', 'python'] };
    const cwd = mkdtempSync(join(tmpdir(), 'poly-all-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    const mise = readFileSync(join(target, 'mise.toml'), 'utf8');
    expect(mise).toContain('node =');
    expect(mise).toContain('rust =');
    expect(mise).toContain('python =');
  });
});
```

- [ ] **Step 8: Run the integration tests**

Run: `pnpm test tests/integration/`
Expected: all PASS — covers rust (3 tests), python (3 tests), polyglot (5 tests), plus the existing TS test (4 tests) = 15 integration tests.

- [ ] **Step 9: Run the full quality gate**

Run: `pnpm check && pnpm test`
Expected: both PASS.

- [ ] **Step 10: Manual CLI smoke test**

```bash
rm -rf /tmp/cw-smoke-rust /tmp/cw-smoke-poly
mkdir -p /tmp/cw-smoke-rust /tmp/cw-smoke-poly

# Rust-only
pnpm dev -- rust-demo \
  --cwd /tmp/cw-smoke-rust \
  --language rust \
  --description "Rust smoke test" \
  --no-git --no-install --yes --non-interactive

ls /tmp/cw-smoke-rust/rust-demo
cat /tmp/cw-smoke-rust/rust-demo/Cargo.toml

# Polyglot TS+Rust
pnpm dev -- poly-demo \
  --cwd /tmp/cw-smoke-poly \
  --language typescript --language rust \
  --description "Polyglot smoke test" \
  --no-git --no-install --yes --non-interactive

ls /tmp/cw-smoke-poly/poly-demo
ls /tmp/cw-smoke-poly/poly-demo/apps/poly-demo
ls /tmp/cw-smoke-poly/poly-demo/crates/poly-demo
cat /tmp/cw-smoke-poly/poly-demo/turbo.json
cat /tmp/cw-smoke-poly/poly-demo/package.json

rm -rf /tmp/cw-smoke-rust /tmp/cw-smoke-poly
```

Expected outputs:

- `rust-demo/`: contains `Cargo.toml`, `src/main.rs`, `rustfmt.toml`, `clippy.toml`, plus shared files (README, AGENTS, .gitignore, mise.toml).
- `poly-demo/`: contains `package.json` (with turbo + private:true), `turbo.json`, `pnpm-workspace.yaml`, plus `apps/poly-demo/` (TS) and `crates/poly-demo/` (Rust).

- [ ] **Step 11: Commit**

```bash
git add src/run.ts src/prompts/questions.ts src/prompts/questions.test.ts tests/integration/
git commit -m "feat: wire Rust/Python/monorepo contributors; force monorepo when polyglot"
```

---

## Self-review checklist (after implementation, before declaring Plan 2 done)

- [ ] `pnpm check` passes
- [ ] `pnpm test` passes (all unit + 15 integration tests)
- [ ] `pnpm dev -- --help` still lists all flags (no regressions in citty)
- [ ] All three CLI smoke tests produce expected output:
  - `--language rust` → root Cargo.toml, src/main.rs
  - `--language rust --rust-workspace` → workspace Cargo.toml, crates/<name>/
  - `--language python` → pyproject.toml, src/<name>/**init**.py
  - `--language python --python-workspace` → workspace pyproject.toml, packages/<name>/
  - `--language typescript --language rust` → apps/<name>/, crates/<name>/, turbo.json
- [ ] No `TODO`/`FIXME`/`TBD` markers introduced
- [ ] `--github` flag still parsed but unused (Plan 3 wires it)
- [ ] `--ci` flag still parsed but unused (Plan 3 wires it)

## What's next (Plan 3)

- **Plan 3** adds the `runGithub` post-step (using `gh repo create`/connect), the CI workflow contributor with per-language and polyglot CI templates, and wires both into the orchestrator. End state: full spec coverage.
