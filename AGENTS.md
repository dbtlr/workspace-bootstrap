# create-workspace

CLI for scaffolding new workspaces with modern TS/Rust/Python tooling.

## Stack

- TypeScript, pnpm, Vite+ (oxlint, oxfmt, vitest, tsdown)
- citty (CLI parser), @clack/prompts (interactive), eta (templates), zod (validation), consola (logging)

## Commands

- `pnpm dev` — run CLI from source via tsx
- `pnpm check` — run `vp check` (typecheck + lint + format)
- `pnpm test` — run vitest via `vp test`
- `pnpm build` — bundle to `dist/` via `vp pack`

## Code conventions

- Strict TS, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`.
- Pure planning layer (`src/plan/`) — no I/O.
- Side-effectful pieces (`src/scaffold/`, `src/post/`) have small focused interfaces.
- TDD: failing test → minimal implementation → passing test → commit.
- Unit tests live next to source as `*.test.ts`. Integration tests in `tests/integration/`.

## Layout

See `docs/superpowers/specs/2026-05-11-create-workspace-design.md` for the architecture overview.
