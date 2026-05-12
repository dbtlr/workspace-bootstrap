# Create Workspace

CLI for scaffolding new workspaces with modern TS/Rust/Python tooling.

## Stack

- TypeScript, pnpm, Vite+ (oxlint, oxfmt, vitest, tsdown)
- citty (CLI parser), @clack/prompts (interactive), eta (templates), zod (validation), consola (logging)

## Commands

- `pnpm dev` — run CLI from source via tsx
- `pnpm check` — run `vp check` (typecheck + lint + format)
- `pnpm test` — run vitest via `vp test`
- `pnpm build` — bundle to `dist/` via `vp pack`

Vite+ owns Git hooks from the root `.vite-hooks/` directory. The pre-commit hook
runs staged checks, and the pre-push hook runs non-build CI checks.

## Code Quality

- Treat linter warnings as errors.
- Run the relevant `pnpm` commands before committing.
- Prefer focused tests for narrow changes and broader coverage when touching
  shared behavior, cross-package contracts, or user-facing workflows.
- Do not disable lint rules without discussing it first.

## Code conventions

- Strict TS, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`.
- Pure planning layer (`src/plan/`) — no I/O.
- Side-effectful pieces (`src/scaffold/`, `src/post/`) have small focused interfaces.
- TDD: failing test → minimal implementation → passing test → commit.
- Unit tests live next to source as `*.test.ts`. Integration tests in `tests/integration/`.

## How We Work

- **Never push to main.** All work should be done in a branch or worktree and
  pushed as a PR.
- **Small meaningful commits.** Create useful checkpoints on long tasks.
- **Discuss first, code second.** Align on package boundaries and user-facing
  behavior before large implementation changes.
- **No broken windows.** Fix errors and warnings encountered while working.

## Vite+

This project uses Vite+ as the package-level toolchain for packages. Run
`vp help` for Vite+ command help inside packages that use it.
