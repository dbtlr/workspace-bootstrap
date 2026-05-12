# Workspace Bootstrap

`create-workspace` — a CLI for scaffolding new workspaces with modern TS/Rust/Python tooling (Vite+, pnpm/bun, oxlint/oxfmt, vitest, mise, cargo, uv, turbo/nx).

## Getting Started

Requires Node `>=24`.

Scaffold a new project interactively:

```sh
npx create-workspace my-app
# or
pnpm create workspace my-app
```

Non-interactive with flags:

```sh
npx create-workspace my-app --language typescript --package-manager pnpm --yes
```

Polyglot monorepo example:

```sh
npx create-workspace my-app \
  --language typescript,rust,python \
  --monorepo turbo \
  --ci \
  --yes
```

Run `npx create-workspace --help` for the full flag list.

## Development

```sh
pnpm install
pnpm dev <name>          # run the CLI from source via tsx
pnpm check               # typecheck + lint + format (vp check)
pnpm build               # bundle to dist/ via vp pack
```

All linter warnings are treated as errors — fix the code, not the rule.

## Testing

```sh
pnpm test                # run vitest once via vp test
pnpm test:watch          # watch mode
```

Unit tests live next to source as `*.test.ts`. Integration tests live in `tests/integration/`.
