# `create-workspace` — design spec

**Status:** approved for planning
**Date:** 2026-05-11
**Owner:** Drew

## Overview

`create-workspace` is a single-binary CLI that scaffolds a new workspace in the current working directory. It's the spiritual successor to the existing `~/data/projects/bootstrap-cli` (`dbtlr-bootstrap`), which will be retired once `create-workspace` ships.

The CLI itself is built with TypeScript, pnpm, and Vite+ (using `vp pack` for builds, `vp check` for the quality gate, `vp staged` for commit hooks). It is published to npm as `create-workspace` and invoked via `npx create-workspace <name>` or `npm create workspace <name>`.

### Goals

- Bootstrap a new project directory at `<cwd>/<name>` with sensible modern defaults.
- Support TypeScript, Rust, and Python — alone or in polyglot combinations.
- Work fully interactively (clack prompts) *or* fully non-interactively (flags), with every prompt skippable via a corresponding flag.
- Make zero filesystem assumptions outside the resolved `--cwd`.
- Leave a structure that scales to future per-pattern scaffolding (CLI apps, web apps with frameworks, etc.) without a refactor.

### Non-goals (v1)

- Scaffolding *patterns* beyond "blank project" (CLI patterns, web app frameworks, etc.) — architecture supports this, but not v1.
- A config file (`workspace-bootstrap.config.ts`) — deferred.
- LICENSE generation — explicitly skipped.
- A `--force` overwrite flag — explicitly skipped.

## Architecture

### Pipeline

```
parse args (citty) ──► resolve options ──► prompt (clack, only for unresolved) ──► validate (zod)
   │                                                                                       │
   └──── --help / --version short-circuit                                                   ▼
                                                                              plan (compute file list + deps)
                                                                                           │
                                                                                           ▼
                                                                              scaffold (write files, mkdir)
                                                                                           │
                                                                                           ▼
                                                                              post-scaffold (git init, commit, github, install)
```

Two key invariants:

- **All prompts are gated by their flag.** If a flag is supplied, the prompt is skipped. If every required option is supplied via flags (or every prompt has a default), the CLI runs end-to-end without prompting.
- **`-C, --cwd <path>`** is the only filesystem assumption. Everything else resolves relative to it. Default is `process.cwd()`. The new project lives at `<cwd>/<name>`.

### Module structure

```
src/
├── index.ts                # bin entry, calls run()
├── cli.ts                  # citty definition: options, help, --version; calls run(parsedOpts)
├── run.ts                  # orchestrator: prompt → validate → plan → scaffold → post
├── options.ts              # zod schema for resolved options + Options type
├── prompts/
│   ├── index.ts            # runPrompts(partialOpts): fills in missing fields via clack
│   └── questions.ts        # individual prompt fns (name, languages, monorepo, etc.)
├── plan/
│   ├── index.ts            # buildPlan(options): runs contributors, merges contributions
│   ├── contributors.ts     # Contributor type + Contribution shape
│   └── contributors/
│       ├── shared.ts       # README, AGENTS.md, gitignore, mise.toml, .editorconfig
│       ├── ci.ts           # GitHub Actions if opts.ci
│       ├── git.ts          # plans the git-init + commit post-steps
│       ├── github.ts       # plans the gh repo create / connect post-step
│       ├── languages/      # ts.ts, rust.ts, python.ts
│       └── patterns/       # FUTURE: cli.ts, web-app-react.ts, etc.
├── scaffold/
│   ├── index.ts            # executePlan(plan, targetDir)
│   ├── render.ts           # eta-based template renderer + plain-copy fallback
│   └── generators/
│       ├── packageJson.ts  # programmatic builder for package.json
│       └── viteConfig.ts   # programmatic builder for vite.config.ts
├── post/
│   ├── git.ts              # git init + first commit
│   ├── github.ts           # gh repo create / verify connection
│   └── install.ts          # pnpm / bun / cargo / uv runner
└── util/
    ├── exec.ts             # spawn wrapper
    ├── log.ts              # consola wrapper (verbose / quiet)
    └── paths.ts            # resolve templates dir from import.meta.url
templates/
├── shared/                 # README.md.tmpl, AGENTS.md.tmpl, .editorconfig, mise.toml.tmpl, gitignore fragments
├── ts/                     # tsconfig.json.tmpl, .oxlintrc.json, .oxfmtrc.json
├── rust/                   # rustfmt.toml, clippy.toml, workspace-Cargo.toml.tmpl, sample crate/
├── python/                 # pyproject.toml.tmpl, ruff.toml, sample package/
├── ci/                     # ts.yml.tmpl, rust.yml.tmpl, python.yml.tmpl, polyglot.yml.tmpl
└── fragments/              # gitignore.shared, gitignore.ts, gitignore.rust, gitignore.python
```

### Boundary discipline

- `cli.ts` only knows about CLI surface. It never touches the filesystem.
- `prompts/` only knows clack. Given a partial `Options`, returns a complete `Options`.
- `plan/` is pure: `Options → Plan`. No I/O. Trivially unit-testable.
- `scaffold/` is the only thing that writes files.
- `post/` is the only thing that runs subprocesses.

Bulk of logic (planning) is pure functions; side-effectful pieces (scaffold, post) have small focused interfaces.

### Contributor model

```ts
type Contribution = {
  files: FilePlan[];
  postSteps: PostStep[];
  deps: { ts?: PkgDeps; rust?: CrateDeps; python?: PyDeps };
};

type Contributor = (opts: Options) => Contribution;
```

`buildPlan(opts)` calls every applicable contributor (shared, ci, git, github, plus the relevant language contributors) and concatenates their contributions. Dep lists are merged per language and consumed by the generators.

To add a future pattern (e.g., "TS CLI app"):
1. Add `kind` to the Options zod schema, one clack prompt, one CLI flag.
2. Drop a file in `plan/contributors/patterns/`.
3. Wire it into the contributor list.

No changes to scaffold, post, prompts wiring, or cli.ts.

## CLI surface

### Invocation

```
npx create-workspace [name] [options]
npm create workspace [name] -- [options]
```

### Options

| Flag | Type | Prompt? | Default |
|---|---|---|---|
| `[name]` positional or `--name <name>` | string | yes | — (required) |
| `--description <text>` | string | yes | `""` |
| `-C, --cwd <path>` | path | no | `process.cwd()` |
| `--language <lang>` (repeatable) | `typescript`\|`rust`\|`python` | yes (multi-select) | — (required) |
| `--monorepo <kind>` | `turbo`\|`nx`\|`none` | yes if TS or polyglot | `turbo` if polyglot, else `none` |
| `--package-manager <pm>` | `pnpm`\|`bun` | yes if TS | `pnpm` |
| `--bun-test <choice>` | `vitest`\|`bun`\|`both` | yes if TS+bun | `vitest` |
| `--rust-workspace` / `--no-rust-workspace` | bool | yes if Rust and not polyglot | `false` |
| `--python-workspace` / `--no-python-workspace` | bool | yes if Python and not polyglot | `false` |
| `--ci` / `--no-ci` | bool | yes interactive only | `false` non-interactive |
| `--github` / `--no-github` | bool | yes interactive only if `gh` on PATH | `false` non-interactive |
| `--github-visibility <v>` | `private`\|`public`\|`internal` | yes if `--github` | `private` |
| `--github-owner <owner>` | string | yes if `--github` | `gh`'s default owner |
| `--git` / `--no-git` | bool | no | `true` |
| `--commit` / `--no-commit` | bool | no | `true` |
| `--install` / `--no-install` | bool | no | `true` |
| `-y, --yes` | bool | — | accept all defaults; skip prompts for anything not required |
| `--non-interactive` | bool | — | force non-interactive; error if a required field is missing |
| `--verbose` | bool | — | `false` |
| `-h, --help` | — | — | print options table and exit |
| `-v, --version` | — | — | print version and exit |

### Interactivity rules

- If stdin isn't a TTY → non-interactive automatically.
- If `--non-interactive` is set → no prompts. Error if a required field (name, language) is missing.
- If `--yes` / `-y` is set → no prompts; accept all defaults; error if a required field with no default is missing.
- Otherwise, only prompt for fields not provided by flags.
- `--help` and `--version` short-circuit before any other logic.

### Validation (zod)

- `name`: matches npm package-name rules (lowercase, no spaces, no leading `.`/`_`, ≤214 chars). Same schema used in prompt validation and flag validation.
- `cwd`: must exist and be a directory.
- `<cwd>/<name>`: must not already exist (no `--force` in v1).
- `language`: at least one selected.

## Template strategy

### On-disk layout

See `templates/` tree in the Module structure section above.

### Unified rendering model

- Any file with a `.tmpl` suffix is processed by **eta**. The suffix is stripped on output: `foo.ts.tmpl` → `foo.ts`.
- Files without the suffix are plain-copied verbatim.
- Eta handles both simple substitution (`<%= it.name %>`) and conditionals (`<% if (it.workspace) { %>...<% } %>`), so the same engine covers prose, configs, and (future) source files.
- After write, language-aware post-formatting runs:
  - oxfmt for `.ts`, `.tsx`, `.js`, `.mjs`
  - ruff for `.py`
  - rustfmt for `.rs`
- Post-formatting means template authors don't have to worry about whitespace artifacts from eta tags. Template source files aren't valid TS at rest (eta tags break parsing), but emitted files are canonical.

### Interpolation context

```ts
type RenderContext = {
  name: string;
  description: string;
  author: { name: string; email: string };  // from `git config user.name/user.email`
  year: number;
  options: Options;  // full options object available for conditionals
};
```

### Programmatic generators

Two files are built programmatically rather than as templates:

- `package.json` — built as a `PackageJson` object, deps merged from contributors, then `JSON.stringify(value, null, 2)`.
- `vite.config.ts` — composed from import lines plus a `defineConfig({...})` body containing `pack`, `lint`, and `staged` blocks based on options. Output is run through oxfmt at write time.

These could move to `.tmpl` later, but stay programmatic in v1 for type-safety.

### `.gitignore` composition

Built by concatenating fragments:

- `fragments/gitignore.shared` — always: `node_modules/`, `dist/`, `.DS_Store`, `.worktrees/`, `.env*`, agent local files (`CLAUDE.local.md`, `.claude/settings.local.json`, etc.)
- `fragments/gitignore.ts` — if TS selected
- `fragments/gitignore.rust` — if Rust selected (`target/`, etc.)
- `fragments/gitignore.python` — if Python selected (`__pycache__/`, `.venv/`, `.ruff_cache/`, etc.)

### Agent docs

`AGENTS.md.tmpl` is the canonical file. After write, `CLAUDE.md` is created as a symlink to `AGENTS.md` (Unix). If symlink creation fails, fall back to a regular file with the content `@AGENTS.md` (Claude Code import syntax).

### Template resolution

`new URL('../templates/', import.meta.url)` → resolved filesystem path. Works for both dev (`vp dev` / tsx) and published (running from `node_modules`).

## Per-language behavior

### TypeScript

- **Files written:** `package.json` (programmatic), `vite.config.ts` (programmatic), `tsconfig.json`, `.oxlintrc.json`, `.oxfmtrc.json`, `src/index.ts`, `tests/smoke.test.ts`.
- **Package manager:** `pnpm` (default) or `bun`. Drives the lockfile, install command, and `packageManager` field in package.json.
- **Test runner:** `vitest` via Vite+. If `--package-manager bun` and `--bun-test bun`, tests use `bun:test` instead and Vite+'s `test` block is omitted. If `both`, both are configured and `vp check` runs vitest while a separate `bun:test` script is available.
- **Monorepo:** if `--monorepo turbo` → adds `turbo.json` and `pnpm-workspace.yaml` (or bun equivalent), creates `apps/` and `packages/` with one sample package. If `--monorepo nx` → uses `nx.json` and the nx layout. If `none` → flat single-package layout.
- **Vite+ commit hooks:** the `staged` block in `vite.config.ts` is populated with `'*.{ts,tsx,js,mjs}': 'vp check --fix'`. After install, the post step runs `vp config` to install the git hooks (unless `--no-hooks`, which isn't in v1 — hooks are tied to install).
- **Non-TS hook fallback:** if TS isn't in the language list (Rust-only or Python-only), lefthook is installed instead with an equivalent staged-files configuration.

### Rust

- **Files written:** `Cargo.toml` (single crate) or workspace `Cargo.toml` + `crates/<name>/Cargo.toml`, `rustfmt.toml`, `clippy.toml`, `src/main.rs` or `src/lib.rs`.
- **Workspace mode:** if `--rust-workspace`, creates a Cargo workspace at root with a sample crate under `crates/<name>/`. Otherwise a single-crate layout.
- **Polyglot:** if TS+Rust polyglot with monorepo, Rust lives at `crates/<name>/` inside the monorepo. No Cargo workspace is created unless `--rust-workspace` is also set.

### Python

- **Files written:** `pyproject.toml` (uv-managed), `ruff.toml`, `src/<name>/__init__.py`, `tests/test_smoke.py`.
- **Workspace mode:** if `--python-workspace`, creates a uv workspace at root with a sample package under `packages/<name>/`. Otherwise a single-package layout under `src/<name>/`.
- **Polyglot:** if Python is part of a polyglot monorepo, lives at `py/<name>/` inside the monorepo root.

### Polyglot layout

When 2+ languages are selected, monorepo is forced (default `turbo`). Layout:

```
<name>/
├── apps/ or packages/      # TS workspaces (if TS selected)
├── crates/                 # Rust crates (if Rust selected)
├── py/                     # Python packages (if Python selected)
├── package.json            # turbo or nx root
├── turbo.json or nx.json
├── mise.toml               # pins node/bun, rustc, python versions
├── AGENTS.md
├── CLAUDE.md → AGENTS.md
├── README.md
└── .github/workflows/ci.yml  # if --ci
```

## Post-scaffold pipeline

In order, each step skippable via its flag:

1. **`git init`** (default on; `--no-git` skips). Initializes the repo.
2. **First commit** (default on; `--no-commit` skips). Stages all and commits as `chore: initial commit`.
3. **GitHub** (default off non-interactive; `--github` enables, `--no-github` disables). Only if `gh` on PATH:
   - If a remote named `origin` already exists, log the URL and skip (or, in interactive mode, ask to verify).
   - Otherwise run `gh repo create <github-owner>/<name> --<visibility> --source=. --remote=origin --push`.
   - If `--no-commit` was set, skip the `--push` and warn.
   - If `gh` exits with auth or other error, surface its message and continue (do not fail the whole scaffold).
4. **Install** (default on; `--no-install` skips):
   - TS: `pnpm install` or `bun install`. Followed by `vp config` to install Vite+ git hooks.
   - Rust: `cargo fetch`.
   - Python: `uv sync`.
   - Polyglot: install runs in each language root in turn.
5. **Commit hooks** (runs whenever install ran; skipped if `--no-install`):
   - If TS is in the language list: `vp config` (installed in step 4 alongside the TS install).
   - Otherwise: `lefthook install` against the lefthook config dropped by the scaffold step.

If any step fails, scaffold is *not* rolled back. The user gets a clear error message describing which step failed, what command ran, and what to do next. Scaffolded files remain in place. Hooks not being installed (because of `--no-install`) is logged but not an error — the user can re-run the install/hook commands manually.

## Tool versions: `mise.toml`

A `mise.toml` is written at the project root with pinned versions for every language in use:

```toml
[tools]
node = "22"            # if TS + pnpm
bun = "1"              # if TS + bun
rust = "1.83"          # if Rust
python = "3.13"        # if Python
```

Replaces `.nvmrc`, `.node-version`, `rust-toolchain.toml`, and `.python-version`. Versions are baked into the template at CLI release time and can be updated by editing the template.

## Error handling & validation

- **Validation errors** (bad project name, target exists, missing required field in non-interactive mode) → friendly message + non-zero exit before any filesystem mutation.
- **Subprocess errors** in post-scaffold → log the failed command and stderr, continue to the next step where independent (install failure shouldn't abort because git already succeeded). Final exit code is non-zero if any step failed.
- **Filesystem errors during scaffold** → abort, surface the path that failed. Files written so far are NOT rolled back; user sees a clear "partial scaffold at `<path>`" message.
- **Interrupted prompts** (ctrl-c in clack) → exit cleanly with code 130; nothing written.

## Testing strategy

- **Unit tests:**
  - `plan/` contributors: pure functions, table-driven tests over option combinations.
  - `scaffold/generators/`: assert emitted strings for representative option sets.
  - `options.ts` zod schema: validates representative valid/invalid inputs.
  - `prompts/`: skip — too tightly coupled to clack to unit-test usefully.
- **Integration tests:**
  - Scaffold a project into a tmpdir for each canonical option combination (TS-only, Rust-only, Python-only, TS+Rust polyglot, etc.). Assert: directory structure, key file contents, that `vp check` / `cargo check` / `ruff check` succeed against the output.
  - Use `--no-install --no-git --no-github` for speed; have a small set of "full pipeline" tests that exercise the post-scaffold steps separately with mocked subprocesses.
- **Runner:** vitest via Vite+.

## Future extension points

Not v1, but the design accommodates:

- **Pattern scaffolding** (CLI apps, web apps with frameworks) → add `plan/contributors/patterns/`, new `kind` option.
- **Config file** (`workspace-bootstrap.config.ts`) → c12-loaded preset feeding into the Options resolution step.
- **Custom template sources** (a `--template <name>` flag pointing at a registry or a directory) → resolution layer above `templates/`.
- **Programmatic API** (`import { createWorkspace } from 'create-workspace'`) → expose `run(options)` from `index.ts`.

## Open items

None. Ready to plan.
