# create-workspace — Plan 3: GitHub integration + CI workflows

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `--ci` and `--github` flags into the orchestrator. `--ci` emits a per-language-combo GitHub Actions workflow at `.github/workflows/ci.yml`. `--github` (when `gh` is on PATH) creates or connects a GitHub remote after the initial commit.

**Architecture:** One new plan-layer contributor (`ciContributor`) that emits the workflow template based on the selected language combo. One new post-step (`runGithub`) that shells out to `gh repo create` after `runGit`, before `runInstall`. Pure command-selection helper (`githubCommandsFor`) extracted for testability, mirroring the `installCommandsFor` pattern from Plan 2.

**Tech Stack:** TypeScript (no new runtime deps), GitHub Actions, the `gh` CLI. CI templates use `voidzero-dev/setup-vp@v1` for TS, `dtolnay/rust-toolchain` + `Swatinem/rust-cache@v2` for Rust, `astral-sh/setup-uv@v3` for Python.

**Reference:**

- [Design spec](../specs/2026-05-11-create-workspace-design.md) — see "Post-scaffold pipeline" and "CI workflow" sections
- [Plan 1 (CLI foundation + TS)](./2026-05-11-create-workspace-plan-1-ts-foundation.md)
- [Plan 2 (Rust + Python + polyglot)](./2026-05-11-create-workspace-plan-2-rust-python-polyglot.md)

**Convention reminder (post-maintenance):** filenames are kebab-case (e.g., `vite-config.ts`, `monorepo-package-json.ts`). Primary exports use `export default`. Named exports are allowed alongside (lint rule is off).

---

## File structure (new + modified)

```
templates/ci/
├── ts.yml.tmpl          # TS-only workflow (vp install/check/test/build)
├── rust.yml.tmpl        # Rust-only workflow (cargo fmt/clippy/test)
├── python.yml.tmpl      # Python-only workflow (uv sync/ruff/pytest)
└── polyglot.yml.tmpl    # Multi-language workflow with eta conditionals

src/plan/contributors/
└── ci.ts                # NEW: picks the right template based on languages

src/post/
└── github.ts            # NEW: githubCommandsFor + runGithub

src/run.ts               # MODIFIED: wire ciContributor + runGithub
```

---

## Layout reference

The CI workflow lives at `.github/workflows/ci.yml` regardless of whether the project is a monorepo or single-package. For polyglot monorepos the workflow has language-conditional steps; for single-language repos the workflow file is template-specific.

`runGithub` fires after `runGit` (so there's a commit to push) and before `runInstall` (so the remote is set up before deps install — purely a UX preference, not a hard ordering requirement).

---

## Task 1: CI workflow templates

Create the four GitHub Actions workflow templates. The single-language ones are mostly static; the polyglot one uses eta conditionals to include per-language steps.

**Files:**

- Create: `templates/ci/ts.yml.tmpl`
- Create: `templates/ci/rust.yml.tmpl`
- Create: `templates/ci/python.yml.tmpl`
- Create: `templates/ci/polyglot.yml.tmpl`

### Step 1: Create `templates/ci/ts.yml.tmpl`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: voidzero-dev/setup-vp@v1
        with:
          node-version: '22'
          cache: true
      - run: vp install
      - run: vp check
      - run: vp test
      - run: vp build
```

### Step 2: Create `templates/ci/rust.yml.tmpl`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - uses: Swatinem/rust-cache@v2
      - run: cargo fmt --check
      - run: cargo clippy --all-targets -- -D warnings
      - run: cargo test
      - run: cargo build --release
```

### Step 3: Create `templates/ci/python.yml.tmpl`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
        with:
          enable-cache: true
      - run: uv python install 3.13
      - run: uv sync
      - run: uv run ruff check
      - run: uv run ruff format --check
      - run: uv run pytest
```

### Step 4: Create `templates/ci/polyglot.yml.tmpl`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
<% if (it.options.languages.includes('typescript')) { %>
      - uses: voidzero-dev/setup-vp@v1
        with:
          node-version: '22'
          cache: true
      - run: vp install
      - run: vp check
      - run: vp test
      - run: vp build
<% } %>
<% if (it.options.languages.includes('rust')) { %>
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - uses: Swatinem/rust-cache@v2
      - run: cargo fmt --check
      - run: cargo clippy --all-targets -- -D warnings
      - run: cargo test
<% } %>
<% if (it.options.languages.includes('python')) { %>
      - uses: astral-sh/setup-uv@v3
        with:
          enable-cache: true
      - run: uv python install 3.13
      - run: uv sync
      - run: uv run ruff check
      - run: uv run ruff format --check
      - run: uv run pytest
<% } %>
```

### Step 5: Run `pnpm check` and `pnpm test` to confirm nothing broke

Run: `pnpm check`
Expected: PASS (templates are under the formatter's ignore patterns).

Run: `pnpm test`
Expected: PASS, no test changes yet.

### Step 6: Commit

```bash
git add templates/ci/
git commit -m "feat(templates): add per-language and polyglot CI workflow templates"
```

---

## Task 2: `ciContributor`

Plan-layer contributor that emits `.github/workflows/ci.yml` when `opts.ci === true`. Picks the right template based on the language combo.

**Files:**

- Create: `src/plan/contributors/ci.ts`
- Create: `src/plan/contributors/ci.test.ts`

### Step 1: Write the failing test

Create `src/plan/contributors/ci.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { Options } from '../../options.js';
import ciContributor from './ci.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: true,
  commit: true,
  cwd: '/tmp',
  description: '',
  git: true,
  github: false,
  githubVisibility: 'private',
  install: true,
  languages: ['typescript'],
  monorepo: 'none',
  name: 'foo',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

describe('ciContributor', () => {
  it('returns empty when ci is false', () => {
    const contribution = ciContributor({ ...baseOptions, ci: false });
    expect(contribution.files).toHaveLength(0);
  });

  it('emits ts.yml template for TS-only', () => {
    const contribution = ciContributor(baseOptions);
    const file = contribution.files.find((f) => f.target === '.github/workflows/ci.yml');
    expect(file?.template).toBe('ci/ts.yml.tmpl');
  });

  it('emits rust.yml template for Rust-only', () => {
    const contribution = ciContributor({ ...baseOptions, languages: ['rust'] });
    const file = contribution.files.find((f) => f.target === '.github/workflows/ci.yml');
    expect(file?.template).toBe('ci/rust.yml.tmpl');
  });

  it('emits python.yml template for Python-only', () => {
    const contribution = ciContributor({ ...baseOptions, languages: ['python'] });
    const file = contribution.files.find((f) => f.target === '.github/workflows/ci.yml');
    expect(file?.template).toBe('ci/python.yml.tmpl');
  });

  it('emits polyglot.yml template for 2+ languages', () => {
    const contribution = ciContributor({
      ...baseOptions,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
    });
    const file = contribution.files.find((f) => f.target === '.github/workflows/ci.yml');
    expect(file?.template).toBe('ci/polyglot.yml.tmpl');
  });

  it('always emits exactly one workflow file', () => {
    const contribution = ciContributor(baseOptions);
    expect(contribution.files).toHaveLength(1);
  });
});
```

### Step 2: Run the test, confirm FAIL

Run: `pnpm test src/plan/contributors/ci.test.ts`
Expected: FAIL — module not found.

### Step 3: Implement `src/plan/contributors/ci.ts`

```ts
import type { Options } from '../../options.js';
import type { Contribution, FilePlan } from '../contributors.js';

const templateFor = (languages: Options['languages']): string => {
  if (languages.length > 1) {
    return 'ci/polyglot.yml.tmpl';
  }
  const [lang] = languages;
  if (lang === 'rust') {
    return 'ci/rust.yml.tmpl';
  }
  if (lang === 'python') {
    return 'ci/python.yml.tmpl';
  }
  return 'ci/ts.yml.tmpl';
};

const ciContributor = (opts: Options): Contribution => {
  if (!opts.ci) {
    return { deps: {}, files: [], postSteps: [] };
  }

  const files: FilePlan[] = [
    {
      target: '.github/workflows/ci.yml',
      template: templateFor(opts.languages),
    },
  ];

  return {
    deps: {},
    files,
    postSteps: [],
  };
};

export default ciContributor;
```

### Step 4: Run the test, confirm PASS

Run: `pnpm test src/plan/contributors/ci.test.ts`
Expected: 6 tests PASS.

Run: `pnpm check`
Expected: PASS.

### Step 5: Commit

```bash
git add src/plan/contributors/ci.ts src/plan/contributors/ci.test.ts
git commit -m "feat(plan): add ciContributor that emits GitHub Actions workflow"
```

---

## Task 3: `runGithub` post-step

After the initial commit, optionally create or connect a GitHub remote via `gh`. Extract the command list into a pure helper `githubCommandsFor` for testability (mirroring the `installCommandsFor` pattern from Plan 2).

**Files:**

- Create: `src/post/github.ts`
- Create: `src/post/github.test.ts`

### Step 1: Write the failing test

Create `src/post/github.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { Options } from '../options.js';
import { githubCommandsFor } from './github.js';

const baseOptions: Options = {
  bunTest: 'vitest',
  ci: false,
  commit: true,
  cwd: '/tmp',
  description: 'A test project',
  git: true,
  github: true,
  githubVisibility: 'private',
  install: true,
  languages: ['typescript'],
  monorepo: 'none',
  name: 'foo',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

describe('githubCommandsFor', () => {
  it('returns empty when github is false', () => {
    const cmds = githubCommandsFor({ ...baseOptions, github: false }, false);
    expect(cmds).toEqual([]);
  });

  it('returns empty when a remote already exists (skip, do not overwrite)', () => {
    const cmds = githubCommandsFor(baseOptions, true);
    expect(cmds).toEqual([]);
  });

  it('builds gh repo create with --private --source=. --remote=origin --push for default', () => {
    const cmds = githubCommandsFor(baseOptions, false);
    expect(cmds).toEqual([
      {
        args: [
          'repo',
          'create',
          'foo',
          '--private',
          '--source=.',
          '--remote=origin',
          '--push',
          '--description',
          'A test project',
        ],
        tool: 'gh',
      },
    ]);
  });

  it('uses --public when githubVisibility is public', () => {
    const cmds = githubCommandsFor({ ...baseOptions, githubVisibility: 'public' }, false);
    expect(cmds[0]?.args).toContain('--public');
    expect(cmds[0]?.args).not.toContain('--private');
  });

  it('uses --internal when githubVisibility is internal', () => {
    const cmds = githubCommandsFor({ ...baseOptions, githubVisibility: 'internal' }, false);
    expect(cmds[0]?.args).toContain('--internal');
  });

  it('uses owner/name format when githubOwner is set', () => {
    const cmds = githubCommandsFor({ ...baseOptions, githubOwner: 'dbtlr' }, false);
    expect(cmds[0]?.args).toContain('dbtlr/foo');
    expect(cmds[0]?.args).not.toContain('foo');
  });

  it('omits --push when commit is false (nothing to push)', () => {
    const cmds = githubCommandsFor({ ...baseOptions, commit: false }, false);
    expect(cmds[0]?.args).not.toContain('--push');
  });

  it('omits --description when description is empty', () => {
    const cmds = githubCommandsFor({ ...baseOptions, description: '' }, false);
    expect(cmds[0]?.args).not.toContain('--description');
  });
});
```

### Step 2: Run the test, confirm FAIL

Run: `pnpm test src/post/github.test.ts`
Expected: FAIL — module not found.

### Step 3: Implement `src/post/github.ts`

```ts
import type { Options } from '../options.js';
import { exec, which } from '../util/exec.js';
import type { Logger } from '../util/log.js';

export type GithubCommand = { tool: string; args: string[] };

export const githubCommandsFor = (opts: Options, hasOriginRemote: boolean): GithubCommand[] => {
  if (!opts.github || hasOriginRemote) {
    return [];
  }

  const repo = opts.githubOwner ? `${opts.githubOwner}/${opts.name}` : opts.name;
  const args: string[] = [
    'repo',
    'create',
    repo,
    `--${opts.githubVisibility}`,
    '--source=.',
    '--remote=origin',
  ];

  if (opts.commit) {
    args.push('--push');
  }

  if (opts.description !== '') {
    args.push('--description', opts.description);
  }

  return [{ args, tool: 'gh' }];
};

const hasOriginRemote = async (targetDir: string): Promise<boolean> => {
  const result = await exec('git', ['remote', 'get-url', 'origin'], { cwd: targetDir });
  return result.code === 0;
};

const runGithub = async (targetDir: string, opts: Options, log: Logger): Promise<void> => {
  if (!opts.github) {
    log.debug('GitHub integration disabled.');
    return;
  }

  if (!(await which('gh'))) {
    log.warn('gh not found on PATH — skipping GitHub setup. Install gh or run manually.');
    return;
  }

  const existing = await hasOriginRemote(targetDir);
  if (existing) {
    const url = await exec('git', ['remote', 'get-url', 'origin'], { cwd: targetDir });
    log.info(`origin remote already configured: ${url.stdout.trim()}`);
    return;
  }

  const cmds = githubCommandsFor(opts, existing);
  for (const { tool, args } of cmds) {
    log.info(`Running ${tool} ${args.join(' ')}…`);
    // eslint-disable-next-line no-await-in-loop
    const result = await exec(tool, args, { cwd: targetDir, inherit: true });
    if (result.code !== 0) {
      log.error(
        `${tool} ${args.slice(0, 3).join(' ')} failed (exit ${result.code}). Continuing without GitHub setup.`,
      );
      return;
    }
  }
  log.success('GitHub repo created and pushed.');
};

export default runGithub;
```

### Step 4: Run the test, confirm PASS

Run: `pnpm test src/post/github.test.ts`
Expected: 8 tests PASS.

Run: `pnpm test`
Expected: full suite PASS, no regressions.

Run: `pnpm check`
Expected: PASS.

### Step 5: Commit

```bash
git add src/post/github.ts src/post/github.test.ts
git commit -m "feat(post): add runGithub for gh repo create / connect"
```

---

## Task 4: Wire `ciContributor` and `runGithub` into the orchestrator

Add `ciContributor` to the `buildPlan` contributor list. Add a `runGithub` call between `runGit` and `runInstall` in `run.ts`.

**Files:**

- Modify: `src/run.ts`

### Step 1: Add imports

In `src/run.ts`, add these imports alongside the existing ones (preserve alphabetical order if the file follows it):

```ts
import ciContributor from './plan/contributors/ci.js';
import runGithub from './post/github.js';
```

### Step 2: Add `ciContributor` to the buildPlan list

Find the existing `buildPlan` call (it currently passes `[sharedContributor, monorepoContributor, tsContributor, rustContributor, pythonContributor]`) and append `ciContributor`:

```ts
const plan = buildPlan(opts, [
  sharedContributor,
  monorepoContributor,
  ciContributor,
  tsContributor,
  rustContributor,
  pythonContributor,
]);
```

The `ciContributor` slot is intentionally between `monorepoContributor` (top-level orchestration files) and the language contributors. Order doesn't affect correctness — no file collisions — but documents the intent that CI is a workspace-level concern.

### Step 3: Add the `runGithub` step in the post-scaffold sequence

Find the section that calls `runGit` and `runInstall` and add a `runGithub` call between them:

```ts
if (opts.git) {
  await runGit(targetDir, opts, log);
}
if (opts.github) {
  await runGithub(targetDir, opts, log);
}
if (opts.install) {
  await runInstall(targetDir, opts, log);
}
```

The ordering matches the design spec: git init+commit → github (so there's a commit to push) → install (so the remote is set up before deps land).

### Step 4: Run the full suite

Run: `pnpm test`
Expected: full suite PASS, no regressions.

Run: `pnpm check`
Expected: PASS.

### Step 5: Commit

```bash
git add src/run.ts
git commit -m "feat(run): wire ciContributor and runGithub into orchestrator"
```

---

## Task 5: End-to-end integration tests

Verify the full pipeline emits the correct CI workflow file content for each language combo. Also test that the `runGithub` post-step's guard branches behave correctly (no-github, gh not available, remote exists — without actually invoking `gh`).

**Files:**

- Create: `tests/integration/ci-workflow.test.ts`

### Step 1: Write the failing test

Create `tests/integration/ci-workflow.test.ts`:

```ts
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Options } from '../../src/options.js';
import ciContributor from '../../src/plan/contributors/ci.js';
import pythonContributor from '../../src/plan/contributors/languages/python.js';
import rustContributor from '../../src/plan/contributors/languages/rust.js';
import tsContributor from '../../src/plan/contributors/languages/ts.js';
import monorepoContributor from '../../src/plan/contributors/monorepo.js';
import sharedContributor from '../../src/plan/contributors/shared.js';
import { buildPlan } from '../../src/plan/index.js';
import { executePlan } from '../../src/scaffold/index.js';

const baseOpts: Options = {
  bunTest: 'vitest',
  ci: true,
  commit: true,
  cwd: '/tmp',
  description: 'CI test',
  git: true,
  github: false,
  githubVisibility: 'private',
  install: true,
  languages: ['typescript'],
  monorepo: 'none',
  name: 'ci-demo',
  packageManager: 'pnpm',
  pythonWorkspace: false,
  rustWorkspace: false,
  verbose: false,
};

const contributors = [
  sharedContributor,
  monorepoContributor,
  ciContributor,
  tsContributor,
  rustContributor,
  pythonContributor,
];

describe('CI workflow end-to-end', () => {
  it('does not emit a workflow when ci is false', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-off-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = { ...baseOpts, ci: false, cwd };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    expect(existsSync(join(target, '.github/workflows/ci.yml'))).toBe(false);
  });

  it('TS-only emits ts workflow with vp commands', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-ts-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = { ...baseOpts, cwd };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('voidzero-dev/setup-vp@v1');
    expect(yml).toContain('vp install');
    expect(yml).toContain('vp check');
    expect(yml).toContain('vp test');
    expect(yml).not.toContain('cargo');
    expect(yml).not.toContain('uv sync');
  });

  it('Rust-only emits rust workflow with cargo commands', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-rust-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = { ...baseOpts, cwd, languages: ['rust'] };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('dtolnay/rust-toolchain');
    expect(yml).toContain('cargo fmt --check');
    expect(yml).toContain('cargo clippy');
    expect(yml).toContain('cargo test');
    expect(yml).not.toContain('vp install');
  });

  it('Python-only emits python workflow with uv + ruff + pytest', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-py-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = { ...baseOpts, cwd, languages: ['python'] };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('astral-sh/setup-uv@v3');
    expect(yml).toContain('uv sync');
    expect(yml).toContain('uv run ruff check');
    expect(yml).toContain('uv run pytest');
  });

  it('Polyglot (TS+Rust) emits polyglot workflow with both stacks', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-poly-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = {
      ...baseOpts,
      cwd,
      languages: ['typescript', 'rust'],
      monorepo: 'turbo',
    };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('voidzero-dev/setup-vp@v1');
    expect(yml).toContain('dtolnay/rust-toolchain');
    expect(yml).toContain('vp check');
    expect(yml).toContain('cargo test');
    expect(yml).not.toContain('uv sync');
  });

  it('Polyglot (all 3 languages) includes all three stack blocks', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'ci-all-'));
    const target = join(cwd, baseOpts.name);
    const opts: Options = {
      ...baseOpts,
      cwd,
      languages: ['typescript', 'rust', 'python'],
      monorepo: 'turbo',
    };
    await executePlan(buildPlan(opts, contributors), opts, { targetDir: target });

    const yml = readFileSync(join(target, '.github/workflows/ci.yml'), 'utf8');
    expect(yml).toContain('voidzero-dev/setup-vp@v1');
    expect(yml).toContain('dtolnay/rust-toolchain');
    expect(yml).toContain('astral-sh/setup-uv@v3');
    expect(yml).toContain('vp test');
    expect(yml).toContain('cargo test');
    expect(yml).toContain('uv run pytest');
  });
});
```

### Step 2: Run the test, confirm PASS

Run: `pnpm test tests/integration/ci-workflow.test.ts`
Expected: 6 tests PASS.

### Step 3: Run the full suite + check

Run: `pnpm test`
Expected: full suite PASS (~133 tests: 113 prior + 6 ci unit + 8 github unit + 6 ci-workflow integration).

Run: `pnpm check`
Expected: PASS, 0 errors, 0 warnings.

### Step 4: Manual CLI smoke test

```bash
rm -rf /tmp/cw-ci-poly
mkdir -p /tmp/cw-ci-poly
pnpm dev ci-poly \
  --cwd /tmp/cw-ci-poly \
  --language typescript --language rust --language python \
  --ci \
  --no-git --no-install --no-commit --yes --non-interactive

echo "--- scaffold layout ---"
ls -la /tmp/cw-ci-poly/ci-poly
echo "--- ci.yml ---"
cat /tmp/cw-ci-poly/ci-poly/.github/workflows/ci.yml

rm -rf /tmp/cw-ci-poly
```

Expected:

- `.github/workflows/ci.yml` exists with TS + Rust + Python step blocks
- All three setup actions present (`setup-vp`, `rust-toolchain`, `setup-uv`)
- Layout includes `apps/ci-poly/`, `crates/ci-poly/`, `py/ci-poly/`, plus the monorepo root files

### Step 5: Commit

```bash
git add tests/integration/ci-workflow.test.ts
git commit -m "test: add end-to-end CI workflow integration tests"
```

---

## Self-review checklist (after implementation, before declaring Plan 3 done)

- [ ] `pnpm check` exits 0
- [ ] `pnpm test` exits 0 (~133 tests total)
- [ ] Manual CLI smoke test produces:
  - `.github/workflows/ci.yml` with TS-only steps when `--language typescript --ci`
  - `.github/workflows/ci.yml` with polyglot steps when `--language typescript --language rust --ci`
  - No CI workflow when `--no-ci`
- [ ] `--github` flag still works (no regression — actual `gh repo create` not tested but `runGithub` guard branches work)
- [ ] `git status` clean after the final commit

## What's left after Plan 3

Plan 3 completes the design spec. Remaining items would be polish/follow-up rather than spec coverage:

- **Publish to npm** as `create-workspace`
- **CI for the CLI itself** (the CLI's own `.github/workflows/ci.yml` — Plan 3 only scaffolds it for _generated_ projects)
- **Real `gh` integration test** (currently only the guard branches are tested)
- **CI matrix strategy for polyglot** (single-job sequential is fine for v1; matrix would parallelize)
