# create-workspace — Plan 1: CLI foundation + TypeScript path

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `create-workspace` CLI itself and the end-to-end TypeScript scaffolding path. After this plan, `npx create-workspace foo --language typescript` scaffolds a working Vite+/pnpm or bun TS project — interactive or fully flag-driven.

**Architecture:** TS-only CLI built with Vite+, pnpm, citty, clack, eta, zod. Pipeline: `parse args → prompt missing → validate → buildPlan (contributors) → executePlan (render + write) → post-scaffold (git/install)`. Pure planning layer, side-effectful scaffold/post layers.

**Tech Stack:** TypeScript, pnpm, Vite+ (vp pack/check/test), citty, @clack/prompts, eta, zod, consola, vitest.

**Out of scope for this plan:** Rust contributor, Python contributor, polyglot, GitHub integration, CI workflow contributor. Those land in Plans 2 and 3.

**Reference:** [Design spec](../specs/2026-05-11-create-workspace-design.md)

---

## Task 1: Bootstrap the CLI repository

Set up the workspace-bootstrap repo itself as a Vite+/pnpm TS project. No tests yet — verification is `vp check` and `vp test` running cleanly with no work to do.

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `.oxlintrc.json`
- Create: `.oxfmtrc.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `mise.toml`
- Create: `AGENTS.md`
- Create: `CLAUDE.md` (symlink to `AGENTS.md`)
- Create: `src/index.ts` (stub)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "create-workspace",
  "version": "0.0.1",
  "description": "Scaffold a new workspace with modern TS/Rust/Python tooling",
  "type": "module",
  "bin": {
    "create-workspace": "./dist/cli.mjs"
  },
  "files": [
    "dist",
    "templates",
    "README.md"
  ],
  "scripts": {
    "dev": "tsx src/cli.ts",
    "build": "vp pack",
    "check": "vp check",
    "test": "vp test",
    "test:watch": "vp test --watch",
    "prepublishOnly": "vp check && vp test && vp pack"
  },
  "dependencies": {
    "@clack/prompts": "^1.2.0",
    "citty": "^0.1.6",
    "consola": "^3.4.2",
    "eta": "^3.5.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "vite-plus": "^1.0.0",
    "vitest": "^4.0.0"
  },
  "packageManager": "pnpm@10.0.0",
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/cli.ts', 'src/index.ts'],
    dts: true,
    format: ['esm'],
    sourcemap: true,
  },
  lint: {
    ignorePatterns: ['dist/**', 'templates/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  staged: {
    '*.{ts,tsx,js,mjs}': 'vp check --fix',
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "templates"]
}
```

- [ ] **Step 4: Create `.oxlintrc.json`**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["eslint", "typescript", "oxc", "import", "unicorn", "promise", "node", "vitest"],
  "categories": {
    "correctness": "error",
    "suspicious": "error",
    "perf": "error",
    "style": "warn",
    "pedantic": "off",
    "restriction": "off",
    "nursery": "off"
  },
  "rules": {
    "no-ternary": "off",
    "sort-imports": "off",
    "no-magic-numbers": "off",
    "import/no-nodejs-modules": "off",
    "typescript/consistent-type-definitions": ["warn", "type"],
    "unicorn/no-null": "off",
    "no-duplicate-imports": ["warn", { "allowSeparateTypeImports": true }]
  },
  "overrides": [
    {
      "files": ["**/*.test.ts"],
      "rules": {
        "max-statements": "off"
      }
    }
  ]
}
```

- [ ] **Step 5: Create `.oxfmtrc.json`**

```json
{
  "$schema": "node_modules/oxfmt/configuration_schema.json",
  "printWidth": 100,
  "singleQuote": true,
  "sortImports": {
    "ignoreCase": true,
    "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
    "ignoreDeclarationSort": false
  }
}
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
.DS_Store
.env*
.worktrees/
CLAUDE.local.md
.claude/settings.local.json
*.log
coverage/
.vite/
```

- [ ] **Step 7: Create `.editorconfig`**

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 8: Create `mise.toml`**

```toml
[tools]
node = "22"
pnpm = "10"
```

- [ ] **Step 9: Create `AGENTS.md`**

```markdown
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
```

- [ ] **Step 10: Create `CLAUDE.md` as a symlink to `AGENTS.md`**

Run:
```bash
ln -s AGENTS.md CLAUDE.md
```

- [ ] **Step 11: Create `src/index.ts` stub**

```ts
export const VERSION = '0.0.1';
```

- [ ] **Step 12: Create `src/cli.ts` stub**

```ts
#!/usr/bin/env node
import { VERSION } from './index.js';

console.log(`create-workspace ${VERSION}`);
```

- [ ] **Step 13: Install dependencies and verify**

Run:
```bash
pnpm install
```
Expected: installs cleanly, creates `pnpm-lock.yaml`.

Run:
```bash
pnpm check
```
Expected: passes (no source files to lint/format issues yet).

Run:
```bash
pnpm test
```
Expected: passes with "no tests found".

Run:
```bash
pnpm dev
```
Expected: prints `create-workspace 0.0.1`.

- [ ] **Step 14: Commit**

```bash
git add .
git commit -m "feat: bootstrap CLI repo with Vite+/pnpm tooling"
```

---

## Task 2: Define the Options type and zod schema

The single source of truth for what the CLI accepts. Used by the parser, prompts, and plan layer.

**Files:**
- Create: `src/options.ts`
- Create: `src/options.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/options.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { OptionsSchema, validateName } from './options.js';

describe('validateName', () => {
  it('accepts valid npm package names', () => {
    expect(validateName('my-project').success).toBe(true);
    expect(validateName('foo123').success).toBe(true);
  });

  it('rejects names with uppercase letters', () => {
    expect(validateName('MyProject').success).toBe(false);
  });

  it('rejects names with leading dot or underscore', () => {
    expect(validateName('.foo').success).toBe(false);
    expect(validateName('_foo').success).toBe(false);
  });

  it('rejects names longer than 214 chars', () => {
    expect(validateName('a'.repeat(215)).success).toBe(false);
  });

  it('rejects empty names', () => {
    expect(validateName('').success).toBe(false);
  });
});

describe('OptionsSchema', () => {
  it('parses a minimal valid options object', () => {
    const result = OptionsSchema.parse({
      name: 'foo',
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
      description: '',
    });
    expect(result.name).toBe('foo');
    expect(result.languages).toEqual(['typescript']);
  });

  it('rejects empty languages array', () => {
    const result = OptionsSchema.safeParse({
      name: 'foo',
      cwd: '/tmp',
      languages: [],
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
      description: '',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/options.test.ts`
Expected: FAIL — `./options.js` not found.

- [ ] **Step 3: Implement `src/options.ts`**

```ts
import { z } from 'zod';

const NPM_NAME_RE = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const MAX_NAME_LEN = 214;

const NameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(MAX_NAME_LEN, `Name must be ≤${MAX_NAME_LEN} characters`)
  .regex(NPM_NAME_RE, 'Name must be a valid npm package name (lowercase, no spaces, no leading . or _)');

export const validateName = (value: string): z.SafeParseReturnType<string, string> =>
  NameSchema.safeParse(value);

export const LanguageSchema = z.enum(['typescript', 'rust', 'python']);
export type Language = z.infer<typeof LanguageSchema>;

export const PackageManagerSchema = z.enum(['pnpm', 'bun']);
export type PackageManager = z.infer<typeof PackageManagerSchema>;

export const BunTestSchema = z.enum(['vitest', 'bun', 'both']);
export type BunTest = z.infer<typeof BunTestSchema>;

export const MonorepoSchema = z.enum(['turbo', 'nx', 'none']);
export type Monorepo = z.infer<typeof MonorepoSchema>;

export const GithubVisibilitySchema = z.enum(['public', 'private', 'internal']);
export type GithubVisibility = z.infer<typeof GithubVisibilitySchema>;

export const OptionsSchema = z.object({
  name: NameSchema,
  description: z.string().default(''),
  cwd: z.string(),
  languages: z.array(LanguageSchema).min(1, 'At least one language is required'),
  packageManager: PackageManagerSchema,
  bunTest: BunTestSchema,
  monorepo: MonorepoSchema,
  rustWorkspace: z.boolean(),
  pythonWorkspace: z.boolean(),
  ci: z.boolean(),
  github: z.boolean(),
  githubVisibility: GithubVisibilitySchema,
  githubOwner: z.string().optional(),
  git: z.boolean(),
  commit: z.boolean(),
  install: z.boolean(),
  verbose: z.boolean(),
});

export type Options = z.infer<typeof OptionsSchema>;
export type PartialOptions = Partial<Options> & Pick<Options, 'cwd'>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/options.test.ts`
Expected: PASS (all cases).

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/options.ts src/options.test.ts
git commit -m "feat(options): define Options schema with zod validation"
```

---

## Task 3: Utility modules (paths, log, exec)

Small shared helpers used by scaffold and post layers.

**Files:**
- Create: `src/util/paths.ts`
- Create: `src/util/paths.test.ts`
- Create: `src/util/log.ts`
- Create: `src/util/exec.ts`

- [ ] **Step 1: Write the failing test for paths**

Create `src/util/paths.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { templatesDir } from './paths.js';

describe('templatesDir', () => {
  it('resolves to a directory that exists', () => {
    const dir = templatesDir();
    expect(existsSync(dir)).toBe(true);
  });

  it('points to the templates dir at the repo root', () => {
    const dir = templatesDir();
    expect(dir.endsWith('/templates') || dir.endsWith('\\templates')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/util/paths.test.ts`
Expected: FAIL — `./paths.js` not found, AND `templates/` dir does not exist yet.

- [ ] **Step 3: Create the templates dir and a placeholder file**

```bash
mkdir -p templates
touch templates/.gitkeep
```

- [ ] **Step 4: Implement `src/util/paths.ts`**

```ts
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const templatesDir = (): string => resolve(__dirname, '../../templates');
```

- [ ] **Step 5: Implement `src/util/log.ts`**

```ts
import { consola } from 'consola';

export type Logger = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  success: (msg: string) => void;
  debug: (msg: string) => void;
};

export const createLogger = (verbose: boolean): Logger => {
  const log = consola.create({ level: verbose ? 4 : 3 });
  return {
    info: (msg) => log.info(msg),
    warn: (msg) => log.warn(msg),
    error: (msg) => log.error(msg),
    success: (msg) => log.success(msg),
    debug: (msg) => log.debug(msg),
  };
};
```

- [ ] **Step 6: Implement `src/util/exec.ts`**

```ts
import { spawn } from 'node:child_process';

export type ExecResult = { stdout: string; stderr: string; code: number };

export type ExecOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  inherit?: boolean;
};

export const exec = async (
  command: string,
  args: string[],
  options: ExecOptions = {},
): Promise<ExecResult> => {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: options.inherit ? 'inherit' : 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      resolvePromise({ stdout, stderr, code: code ?? 0 });
    });
  });
};

export const which = async (command: string): Promise<boolean> => {
  const result = await exec(process.platform === 'win32' ? 'where' : 'which', [command]);
  return result.code === 0;
};
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm test src/util/paths.test.ts`
Expected: PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/util/ templates/.gitkeep
git commit -m "feat(util): add paths, log, exec helpers"
```

---

## Task 4: Plan types and `buildPlan` skeleton

The pure planning layer. Contributors return `Contribution`s; `buildPlan` merges them.

**Files:**
- Create: `src/plan/contributors.ts`
- Create: `src/plan/index.ts`
- Create: `src/plan/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/plan/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../options.js';
import { buildPlan } from './index.js';

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

describe('buildPlan', () => {
  it('returns a Plan with empty contributions when no contributors registered', () => {
    const plan = buildPlan(baseOptions, []);
    expect(plan.files).toEqual([]);
    expect(plan.postSteps).toEqual([]);
  });

  it('merges file plans from multiple contributors', () => {
    const plan = buildPlan(baseOptions, [
      () => ({
        files: [{ template: 'a.txt', target: 'a.txt' }],
        postSteps: [],
        deps: {},
      }),
      () => ({
        files: [{ template: 'b.txt', target: 'b.txt' }],
        postSteps: [],
        deps: {},
      }),
    ]);
    expect(plan.files).toHaveLength(2);
    expect(plan.files[0]?.target).toBe('a.txt');
    expect(plan.files[1]?.target).toBe('b.txt');
  });

  it('merges TS deps from multiple contributors', () => {
    const plan = buildPlan(baseOptions, [
      () => ({ files: [], postSteps: [], deps: { ts: { dependencies: { zod: '^4.0.0' } } } }),
      () => ({ files: [], postSteps: [], deps: { ts: { dependencies: { citty: '^0.1.0' } } } }),
    ]);
    expect(plan.deps.ts?.dependencies).toEqual({
      zod: '^4.0.0',
      citty: '^0.1.0',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/plan/index.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/plan/contributors.ts`**

```ts
import type { Options } from '../options.js';

export type FilePlan = {
  /** Path to template file under `templates/`, e.g. `'shared/README.md.tmpl'`. */
  template?: string;
  /** Raw content to write — used by programmatic generators instead of `template`. */
  content?: string;
  /** Output path relative to the target dir, e.g. `'README.md'`. */
  target: string;
  /** If true, content should be treated as already-final (skip eta). Defaults based on file ext. */
  raw?: boolean;
};

export type PostStep = {
  kind: 'git-init' | 'git-commit' | 'install' | 'hooks';
  args?: Record<string, string | boolean>;
};

export type PkgDeps = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export type CrateDeps = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type PyDeps = {
  dependencies?: string[];
  devDependencies?: string[];
};

export type Contribution = {
  files: FilePlan[];
  postSteps: PostStep[];
  deps: {
    ts?: PkgDeps;
    rust?: CrateDeps;
    python?: PyDeps;
  };
};

export type Contributor = (opts: Options) => Contribution;

export type Plan = {
  files: FilePlan[];
  postSteps: PostStep[];
  deps: {
    ts?: PkgDeps;
    rust?: CrateDeps;
    python?: PyDeps;
  };
};
```

- [ ] **Step 4: Implement `src/plan/index.ts`**

```ts
import type { Options } from '../options.js';
import type { Contributor, PkgDeps, Plan } from './contributors.js';

const mergePkgDeps = (a: PkgDeps | undefined, b: PkgDeps | undefined): PkgDeps | undefined => {
  if (!a && !b) return undefined;
  return {
    dependencies: { ...a?.dependencies, ...b?.dependencies },
    devDependencies: { ...a?.devDependencies, ...b?.devDependencies },
    scripts: { ...a?.scripts, ...b?.scripts },
  };
};

export const buildPlan = (opts: Options, contributors: Contributor[]): Plan => {
  const plan: Plan = { files: [], postSteps: [], deps: {} };
  for (const contributor of contributors) {
    const contribution = contributor(opts);
    plan.files.push(...contribution.files);
    plan.postSteps.push(...contribution.postSteps);
    if (contribution.deps.ts) {
      plan.deps.ts = mergePkgDeps(plan.deps.ts, contribution.deps.ts);
    }
    if (contribution.deps.rust) {
      plan.deps.rust = {
        dependencies: { ...plan.deps.rust?.dependencies, ...contribution.deps.rust.dependencies },
        devDependencies: {
          ...plan.deps.rust?.devDependencies,
          ...contribution.deps.rust.devDependencies,
        },
      };
    }
    if (contribution.deps.python) {
      plan.deps.python = {
        dependencies: [
          ...(plan.deps.python?.dependencies ?? []),
          ...(contribution.deps.python.dependencies ?? []),
        ],
        devDependencies: [
          ...(plan.deps.python?.devDependencies ?? []),
          ...(contribution.deps.python.devDependencies ?? []),
        ],
      };
    }
  }
  return plan;
};

export type { Contributor, Plan } from './contributors.js';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test src/plan/index.test.ts`
Expected: PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plan/
git commit -m "feat(plan): add Contributor type and buildPlan merger"
```

---

## Task 5: Shared contributor + shared templates

Files that every workspace gets regardless of language: README, AGENTS.md, .gitignore, mise.toml, .editorconfig.

**Files:**
- Create: `templates/shared/README.md.tmpl`
- Create: `templates/shared/AGENTS.md.tmpl`
- Create: `templates/shared/.editorconfig`
- Create: `templates/shared/mise.toml.tmpl`
- Create: `templates/fragments/gitignore.shared`
- Create: `src/plan/contributors/shared.ts`
- Create: `src/plan/contributors/shared.test.ts`

- [ ] **Step 1: Create `templates/shared/README.md.tmpl`**

```markdown
# <%= it.name %>

<%= it.description %>

## Getting started

<% if (it.options.languages.includes('typescript')) { %>
```bash
<%= it.options.packageManager %> install
<%= it.options.packageManager %> dev
```
<% } %>
<% if (it.options.languages.includes('rust')) { %>
```bash
cargo run
```
<% } %>
<% if (it.options.languages.includes('python')) { %>
```bash
uv sync
uv run python -m <%= it.name.replace(/-/g, '_') %>
```
<% } %>

## Tooling

This workspace was bootstrapped with [`create-workspace`](https://www.npmjs.com/package/create-workspace).
```

- [ ] **Step 2: Create `templates/shared/AGENTS.md.tmpl`**

```markdown
# <%= it.name %>

<%= it.description %>

## Stack

<% if (it.options.languages.includes('typescript')) { %>- TypeScript via Vite+ (oxlint, oxfmt, vitest, tsdown), package manager: <%= it.options.packageManager %>
<% } %>
<% if (it.options.languages.includes('rust')) { %>- Rust via cargo<% if (it.options.rustWorkspace) { %> (workspace mode)<% } %>
<% } %>
<% if (it.options.languages.includes('python')) { %>- Python via uv (ruff, pytest)<% if (it.options.pythonWorkspace) { %> (workspace mode)<% } %>
<% } %>

## Commands

<% if (it.options.languages.includes('typescript')) { %>- `<%= it.options.packageManager %> check` — run lint, format, typecheck
- `<%= it.options.packageManager %> test` — run tests
- `<%= it.options.packageManager %> build` — build the project
<% } %>
<% if (it.options.languages.includes('rust')) { %>- `cargo check` / `cargo test` / `cargo build`
<% } %>
<% if (it.options.languages.includes('python')) { %>- `uv run ruff check` / `uv run pytest`
<% } %>

## Code conventions

- TDD: failing test → minimal implementation → passing test → commit.
- Treat all linter warnings as errors.
- Keep functions small and focused.
- Document architecture in `docs/architecture/` when adding subsystems.
```

- [ ] **Step 3: Create `templates/shared/.editorconfig`**

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{rs,toml}]
indent_size = 4

[*.py]
indent_size = 4
```

- [ ] **Step 4: Create `templates/shared/mise.toml.tmpl`**

```toml
[tools]
<% if (it.options.languages.includes('typescript')) { %>node = "22"
<% if (it.options.packageManager === 'pnpm') { %>pnpm = "10"
<% } %><% if (it.options.packageManager === 'bun') { %>bun = "1"
<% } %><% } %>
<% if (it.options.languages.includes('rust')) { %>rust = "1.83"
<% } %>
<% if (it.options.languages.includes('python')) { %>python = "3.13"
uv = "latest"
<% } %>
```

- [ ] **Step 5: Create `templates/fragments/gitignore.shared`**

```
.DS_Store
.env
.env.*
!.env.example
.worktrees/
*.log
coverage/
.idea/
.vscode/
CLAUDE.local.md
.claude/settings.local.json
```

- [ ] **Step 6: Write the failing test**

Create `src/plan/contributors/shared.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../../options.js';
import { sharedContributor } from './shared.js';

const baseOptions: Options = {
  name: 'foo',
  description: 'My project',
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

describe('sharedContributor', () => {
  it('contributes README, AGENTS.md, .editorconfig, mise.toml, .gitignore', () => {
    const contribution = sharedContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('README.md');
    expect(targets).toContain('AGENTS.md');
    expect(targets).toContain('CLAUDE.md');
    expect(targets).toContain('.editorconfig');
    expect(targets).toContain('mise.toml');
    expect(targets).toContain('.gitignore');
  });

  it('builds .gitignore from shared fragment plus per-language fragments', () => {
    const ts = sharedContributor({ ...baseOptions, languages: ['typescript'] });
    const tsGitignore = ts.files.find((f) => f.target === '.gitignore');
    expect(tsGitignore?.content).toContain('node_modules/');
    expect(tsGitignore?.content).toContain('.worktrees/');
  });

  it('emits CLAUDE.md as a symlink marker', () => {
    const contribution = sharedContributor(baseOptions);
    const claude = contribution.files.find((f) => f.target === 'CLAUDE.md');
    expect(claude?.content).toBe('@AGENTS.md\n');
    expect(claude?.raw).toBe(true);
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `pnpm test src/plan/contributors/shared.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Implement `src/plan/contributors/shared.ts`**

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Language, Options } from '../../options.js';
import { templatesDir } from '../../util/paths.js';
import type { Contribution, FilePlan } from '../contributors.js';

const readFragment = (name: string): string => {
  const path = join(templatesDir(), 'fragments', name);
  return readFileSync(path, 'utf8');
};

const buildGitignore = (languages: Language[]): string => {
  const parts = [readFragment('gitignore.shared')];
  for (const lang of languages) {
    try {
      parts.push(readFragment(`gitignore.${lang === 'typescript' ? 'ts' : lang}`));
    } catch {
      // Per-language fragment may not exist yet (added in language contributor tasks).
    }
  }
  return parts.join('\n');
};

export const sharedContributor = (opts: Options): Contribution => {
  const files: FilePlan[] = [
    { template: 'shared/README.md.tmpl', target: 'README.md' },
    { template: 'shared/AGENTS.md.tmpl', target: 'AGENTS.md' },
    { template: 'shared/.editorconfig', target: '.editorconfig' },
    { template: 'shared/mise.toml.tmpl', target: 'mise.toml' },
    { target: '.gitignore', content: buildGitignore(opts.languages), raw: true },
    { target: 'CLAUDE.md', content: '@AGENTS.md\n', raw: true },
  ];

  return {
    files,
    postSteps: [],
    deps: {},
  };
};
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `pnpm test src/plan/contributors/shared.test.ts`
Expected: PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add templates/ src/plan/contributors/
git commit -m "feat(plan): add shared contributor and base templates"
```

---

## Task 6: Render module (eta + plain copy + post-format)

Converts a `FilePlan` into final file content. Owns the eta integration and post-format dispatch.

**Files:**
- Create: `src/scaffold/render.ts`
- Create: `src/scaffold/render.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/scaffold/render.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Options } from '../options.js';
import { renderFile } from './render.js';

const baseOptions: Options = {
  name: 'foo',
  description: 'My project',
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

let tmpRoot: string;
beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'render-test-'));
});

describe('renderFile', () => {
  it('returns content verbatim when raw is true', async () => {
    const result = await renderFile(
      { target: 'foo.txt', content: 'hello', raw: true },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('hello');
  });

  it('renders an eta template with interpolation', async () => {
    const templatePath = join(tmpRoot, 'sample.txt.tmpl');
    writeFileSync(templatePath, 'name=<%= it.name %>');
    const result = await renderFile(
      { template: 'sample.txt.tmpl', target: 'sample.txt' },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('name=foo');
  });

  it('renders an eta template with conditionals', async () => {
    const templatePath = join(tmpRoot, 'sample.md.tmpl');
    writeFileSync(
      templatePath,
      '<% if (it.options.packageManager === "pnpm") { %>pnpm<% } else { %>bun<% } %>',
    );
    const result = await renderFile(
      { template: 'sample.md.tmpl', target: 'sample.md' },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('pnpm');
  });

  it('plain-copies templates with no .tmpl suffix', async () => {
    const templatePath = join(tmpRoot, 'static.txt');
    writeFileSync(templatePath, 'literal content');
    const result = await renderFile(
      { template: 'static.txt', target: 'static.txt' },
      baseOptions,
      tmpRoot,
    );
    expect(result).toBe('literal content');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/scaffold/render.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/scaffold/render.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Eta } from 'eta';
import type { Options } from '../options.js';
import type { FilePlan } from '../plan/contributors.js';

export type RenderContext = {
  name: string;
  description: string;
  author: { name: string; email: string };
  year: number;
  options: Options;
};

const eta = new Eta({ autoEscape: false, useWith: false });

export const buildRenderContext = (opts: Options, author: { name: string; email: string }): RenderContext => ({
  name: opts.name,
  description: opts.description,
  author,
  year: new Date().getFullYear(),
  options: opts,
});

export const renderFile = async (
  plan: FilePlan,
  opts: Options,
  templatesRoot: string,
  author: { name: string; email: string } = { name: '', email: '' },
): Promise<string> => {
  if (plan.content !== undefined) {
    return plan.content;
  }
  if (!plan.template) {
    throw new Error(`FilePlan for ${plan.target} has neither template nor content`);
  }

  const fullPath = join(templatesRoot, plan.template);
  const source = await readFile(fullPath, 'utf8');

  if (plan.raw || !plan.template.endsWith('.tmpl')) {
    return source;
  }

  const ctx = buildRenderContext(opts, author);
  const rendered = eta.renderString(source, ctx);
  return rendered;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/scaffold/render.test.ts`
Expected: PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scaffold/
git commit -m "feat(scaffold): add eta-based render module"
```

---

## Task 7: `executePlan` — write files to disk

Materializes a `Plan` into the target directory. The only place that writes files.

**Files:**
- Create: `src/scaffold/index.ts`
- Create: `src/scaffold/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/scaffold/index.test.ts`:

```ts
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Options } from '../options.js';
import type { Plan } from '../plan/contributors.js';
import { executePlan } from './index.js';

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

describe('executePlan', () => {
  it('writes raw-content files into the target directory', async () => {
    const targetDir = mkdtempSync(join(tmpdir(), 'exec-plan-'));
    const plan: Plan = {
      files: [
        { target: 'README.md', content: '# foo\n', raw: true },
        { target: 'config/app.json', content: '{}\n', raw: true },
      ],
      postSteps: [],
      deps: {},
    };
    await executePlan(plan, targetDir, baseOptions);
    expect(readFileSync(join(targetDir, 'README.md'), 'utf8')).toBe('# foo\n');
    expect(readFileSync(join(targetDir, 'config/app.json'), 'utf8')).toBe('{}\n');
  });

  it('creates nested directories as needed', async () => {
    const targetDir = mkdtempSync(join(tmpdir(), 'exec-plan-'));
    const plan: Plan = {
      files: [{ target: 'src/util/foo.ts', content: 'export {}', raw: true }],
      postSteps: [],
      deps: {},
    };
    await executePlan(plan, targetDir, baseOptions);
    expect(readFileSync(join(targetDir, 'src/util/foo.ts'), 'utf8')).toBe('export {}');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/scaffold/index.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/scaffold/index.ts`**

```ts
import { mkdir, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Options } from '../options.js';
import type { Plan } from '../plan/contributors.js';
import { templatesDir } from '../util/paths.js';
import { renderFile } from './render.js';

export type ExecutePlanOptions = {
  templatesRoot?: string;
  author?: { name: string; email: string };
};

export const executePlan = async (
  plan: Plan,
  targetDir: string,
  opts: Options,
  execOpts: ExecutePlanOptions = {},
): Promise<void> => {
  const templatesRoot = execOpts.templatesRoot ?? templatesDir();
  const author = execOpts.author ?? { name: '', email: '' };

  await mkdir(targetDir, { recursive: true });

  for (const file of plan.files) {
    const fullTarget = join(targetDir, file.target);
    await mkdir(dirname(fullTarget), { recursive: true });

    if (file.target === 'CLAUDE.md' && file.content === '@AGENTS.md\n') {
      try {
        await symlink('AGENTS.md', fullTarget);
        continue;
      } catch {
        // Fall through to writeFile with the @AGENTS.md import-syntax content.
      }
    }

    const content = await renderFile(file, opts, templatesRoot, author);
    await writeFile(fullTarget, content, 'utf8');
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/scaffold/index.test.ts`
Expected: PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scaffold/index.ts src/scaffold/index.test.ts
git commit -m "feat(scaffold): add executePlan to materialize a Plan to disk"
```

---

## Task 8: TS language contributor + programmatic generators

The contributor that adds TypeScript-specific files. Includes `packageJson.ts` and `viteConfig.ts` generators (programmatic, not template-based).

**Files:**
- Create: `templates/ts/tsconfig.json.tmpl`
- Create: `templates/ts/.oxlintrc.json`
- Create: `templates/ts/.oxfmtrc.json`
- Create: `templates/ts/src/index.ts.tmpl`
- Create: `templates/ts/tests/smoke.test.ts.tmpl`
- Create: `templates/fragments/gitignore.ts`
- Create: `src/scaffold/generators/packageJson.ts`
- Create: `src/scaffold/generators/packageJson.test.ts`
- Create: `src/scaffold/generators/viteConfig.ts`
- Create: `src/scaffold/generators/viteConfig.test.ts`
- Create: `src/plan/contributors/languages/ts.ts`
- Create: `src/plan/contributors/languages/ts.test.ts`

- [ ] **Step 1: Create `templates/ts/tsconfig.json.tmpl`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 2: Create `templates/ts/.oxlintrc.json`**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["eslint", "typescript", "oxc", "import", "unicorn", "promise", "node", "vitest"],
  "categories": {
    "correctness": "error",
    "suspicious": "error",
    "perf": "error",
    "style": "warn",
    "pedantic": "off",
    "restriction": "off",
    "nursery": "off"
  },
  "rules": {
    "no-magic-numbers": "off",
    "typescript/consistent-type-definitions": ["warn", "type"]
  }
}
```

- [ ] **Step 3: Create `templates/ts/.oxfmtrc.json`**

```json
{
  "$schema": "node_modules/oxfmt/configuration_schema.json",
  "printWidth": 100,
  "singleQuote": true
}
```

- [ ] **Step 4: Create `templates/ts/src/index.ts.tmpl`**

```ts
export const greet = (name: string): string => `Hello, ${name}!`;
```

- [ ] **Step 5: Create `templates/ts/tests/smoke.test.ts.tmpl`**

```ts
import { describe, expect, it } from 'vitest';
import { greet } from '../src/index.js';

describe('greet', () => {
  it('returns a greeting', () => {
    expect(greet('world')).toBe('Hello, world!');
  });
});
```

- [ ] **Step 6: Create `templates/fragments/gitignore.ts`**

```
node_modules/
dist/
.vite/
.tsbuildinfo
*.tsbuildinfo
```

- [ ] **Step 7: Write the failing test for `packageJson` generator**

Create `src/scaffold/generators/packageJson.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../../options.js';
import type { PkgDeps } from '../../plan/contributors.js';
import { renderPackageJson } from './packageJson.js';

const baseOptions: Options = {
  name: 'foo',
  description: 'My project',
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

describe('renderPackageJson', () => {
  it('produces a valid JSON string', () => {
    const deps: PkgDeps = { dependencies: { zod: '^4.0.0' }, scripts: {} };
    const json = renderPackageJson(baseOptions, deps);
    const parsed = JSON.parse(json) as { name: string; type: string; dependencies: Record<string, string> };
    expect(parsed.name).toBe('foo');
    expect(parsed.type).toBe('module');
    expect(parsed.dependencies.zod).toBe('^4.0.0');
  });

  it('includes the description', () => {
    const json = renderPackageJson({ ...baseOptions, description: 'A thing' }, {});
    const parsed = JSON.parse(json) as { description: string };
    expect(parsed.description).toBe('A thing');
  });

  it('sets packageManager based on options', () => {
    const pnpm = JSON.parse(renderPackageJson(baseOptions, {})) as { packageManager: string };
    expect(pnpm.packageManager).toMatch(/^pnpm@/);
    const bun = JSON.parse(renderPackageJson({ ...baseOptions, packageManager: 'bun' }, {})) as {
      packageManager: string;
    };
    expect(bun.packageManager).toMatch(/^bun@/);
  });

  it('adds bun:test script when bunTest is bun or both', () => {
    const bothOpts: Options = { ...baseOptions, packageManager: 'bun', bunTest: 'both' };
    const parsed = JSON.parse(renderPackageJson(bothOpts, {})) as { scripts: Record<string, string> };
    expect(parsed.scripts['test:bun']).toBe('bun test');
  });
});
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `pnpm test src/scaffold/generators/packageJson.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 9: Implement `src/scaffold/generators/packageJson.ts`**

```ts
import type { Options } from '../../options.js';
import type { PkgDeps } from '../../plan/contributors.js';

const PNPM_VERSION = '10.0.0';
const BUN_VERSION = '1.1.0';

const baseScripts = (opts: Options): Record<string, string> => {
  const scripts: Record<string, string> = {
    dev: 'tsx src/index.ts',
    build: 'vp pack',
    check: 'vp check',
    test: 'vp test',
    'test:watch': 'vp test --watch',
  };
  if (opts.packageManager === 'bun' && (opts.bunTest === 'bun' || opts.bunTest === 'both')) {
    scripts['test:bun'] = 'bun test';
  }
  if (opts.packageManager === 'bun' && opts.bunTest === 'bun') {
    scripts.test = 'bun test';
    delete scripts['test:watch'];
  }
  return scripts;
};

const baseDeps = (): PkgDeps => ({
  dependencies: {},
  devDependencies: {
    '@types/node': '^22.0.0',
    tsx: '^4.21.0',
    typescript: '^5.9.3',
    'vite-plus': '^1.0.0',
    vitest: '^4.0.0',
  },
});

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
    packageManager:
      opts.packageManager === 'pnpm' ? `pnpm@${PNPM_VERSION}` : `bun@${BUN_VERSION}`,
    engines: { node: '>=22' },
  };

  return `${JSON.stringify(pkg, null, 2)}\n`;
};
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `pnpm test src/scaffold/generators/packageJson.test.ts`
Expected: PASS.

- [ ] **Step 11: Write the failing test for `viteConfig` generator**

Create `src/scaffold/generators/viteConfig.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../../options.js';
import { renderViteConfig } from './viteConfig.js';

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

describe('renderViteConfig', () => {
  it('includes the defineConfig import and call', () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain("import { defineConfig } from 'vite-plus'");
    expect(out).toContain('defineConfig(');
  });

  it('includes a staged block by default', () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain('staged:');
    expect(out).toContain('vp check --fix');
  });

  it('omits the staged block when bunTest is bun-only (no vp)', () => {
    const out = renderViteConfig({ ...baseOptions, packageManager: 'bun', bunTest: 'bun' });
    expect(out).not.toContain('staged:');
  });
});
```

- [ ] **Step 12: Run the test to verify it fails**

Run: `pnpm test src/scaffold/generators/viteConfig.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 13: Implement `src/scaffold/generators/viteConfig.ts`**

```ts
import type { Options } from '../../options.js';

export const renderViteConfig = (opts: Options): string => {
  const usingVitePlus = !(opts.packageManager === 'bun' && opts.bunTest === 'bun');

  const lines = [`import { defineConfig } from 'vite-plus';`, ''];
  lines.push('export default defineConfig({');
  lines.push('  pack: {');
  lines.push(`    entry: ['src/index.ts'],`);
  lines.push('    dts: true,');
  lines.push(`    format: ['esm'],`);
  lines.push('  },');
  lines.push('  lint: {');
  lines.push(`    ignorePatterns: ['dist/**'],`);
  lines.push('    options: {');
  lines.push('      typeAware: true,');
  lines.push('      typeCheck: true,');
  lines.push('    },');
  lines.push('  },');
  if (usingVitePlus) {
    lines.push('  staged: {');
    lines.push(`    '*.{ts,tsx,js,mjs}': 'vp check --fix',`);
    lines.push('  },');
  }
  lines.push('});');
  lines.push('');

  return lines.join('\n');
};
```

- [ ] **Step 14: Run the test to verify it passes**

Run: `pnpm test src/scaffold/generators/viteConfig.test.ts`
Expected: PASS.

- [ ] **Step 15: Write the failing test for the TS contributor**

Create `src/plan/contributors/languages/ts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Options } from '../../../options.js';
import { tsContributor } from './ts.js';

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

describe('tsContributor', () => {
  it('returns empty contribution when TypeScript is not in languages', () => {
    const contribution = tsContributor({ ...baseOptions, languages: ['rust'] });
    expect(contribution.files).toHaveLength(0);
  });

  it('contributes tsconfig, oxlint, oxfmt, package.json, vite.config.ts, src, test', () => {
    const contribution = tsContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain('tsconfig.json');
    expect(targets).toContain('.oxlintrc.json');
    expect(targets).toContain('.oxfmtrc.json');
    expect(targets).toContain('package.json');
    expect(targets).toContain('vite.config.ts');
    expect(targets).toContain('src/index.ts');
    expect(targets).toContain('tests/smoke.test.ts');
  });

  it('package.json content reflects the project name and pnpm', () => {
    const contribution = tsContributor(baseOptions);
    const pkg = contribution.files.find((f) => f.target === 'package.json');
    expect(pkg?.content).toContain('"name": "foo"');
    expect(pkg?.content).toContain('pnpm@');
  });
});
```

- [ ] **Step 16: Run the test to verify it fails**

Run: `pnpm test src/plan/contributors/languages/ts.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 17: Implement `src/plan/contributors/languages/ts.ts`**

```ts
import type { Options } from '../../../options.js';
import { renderPackageJson } from '../../../scaffold/generators/packageJson.js';
import { renderViteConfig } from '../../../scaffold/generators/viteConfig.js';
import type { Contribution, FilePlan, PkgDeps } from '../../contributors.js';

export const tsContributor = (opts: Options): Contribution => {
  if (!opts.languages.includes('typescript')) {
    return { files: [], postSteps: [], deps: {} };
  }

  const contributedDeps: PkgDeps = {
    dependencies: {},
    devDependencies: {},
    scripts: {},
  };

  const files: FilePlan[] = [
    { template: 'ts/tsconfig.json.tmpl', target: 'tsconfig.json' },
    { template: 'ts/.oxlintrc.json', target: '.oxlintrc.json' },
    { template: 'ts/.oxfmtrc.json', target: '.oxfmtrc.json' },
    { template: 'ts/src/index.ts.tmpl', target: 'src/index.ts' },
    { template: 'ts/tests/smoke.test.ts.tmpl', target: 'tests/smoke.test.ts' },
    { target: 'package.json', content: renderPackageJson(opts, contributedDeps), raw: true },
    { target: 'vite.config.ts', content: renderViteConfig(opts), raw: true },
  ];

  return {
    files,
    postSteps: [],
    deps: { ts: contributedDeps },
  };
};
```

- [ ] **Step 18: Run the test to verify it passes**

Run: `pnpm test src/plan/contributors/languages/ts.test.ts`
Expected: PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 19: Commit**

```bash
git add templates/ts/ templates/fragments/gitignore.ts src/scaffold/generators/ src/plan/contributors/languages/
git commit -m "feat(plan): add TS contributor with package.json + vite.config.ts generators"
```

---

## Task 9: Prompts (clack)

The interactive layer. Given a `PartialOptions`, asks clack questions for missing fields, returns a fully-resolved `Options`.

**Files:**
- Create: `src/prompts/questions.ts`
- Create: `src/prompts/index.ts`
- Create: `src/prompts/questions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/prompts/questions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyDefaults } from './questions.js';

describe('applyDefaults', () => {
  it('defaults monorepo to none for single-language TS', () => {
    const out = applyDefaults({ cwd: '/tmp', languages: ['typescript'] });
    expect(out.monorepo).toBe('none');
  });

  it('defaults monorepo to turbo for polyglot', () => {
    const out = applyDefaults({ cwd: '/tmp', languages: ['typescript', 'rust'] });
    expect(out.monorepo).toBe('turbo');
  });

  it('defaults packageManager to pnpm', () => {
    const out = applyDefaults({ cwd: '/tmp', languages: ['typescript'] });
    expect(out.packageManager).toBe('pnpm');
  });

  it('defaults git/commit/install to true', () => {
    const out = applyDefaults({ cwd: '/tmp', languages: ['typescript'] });
    expect(out.git).toBe(true);
    expect(out.commit).toBe(true);
    expect(out.install).toBe(true);
  });

  it('preserves explicitly-set values', () => {
    const out = applyDefaults({
      cwd: '/tmp',
      languages: ['typescript'],
      packageManager: 'bun',
      monorepo: 'nx',
    });
    expect(out.packageManager).toBe('bun');
    expect(out.monorepo).toBe('nx');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/prompts/questions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/prompts/questions.ts`**

```ts
import * as clack from '@clack/prompts';
import type { Options, PartialOptions } from '../options.js';
import { validateName } from '../options.js';

export const applyDefaults = (partial: PartialOptions): PartialOptions => {
  const isPolyglot = (partial.languages?.length ?? 0) > 1;
  return {
    description: '',
    monorepo: isPolyglot ? 'turbo' : 'none',
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
};

const cancelIfNeeded = <T>(value: T | symbol): T => {
  if (clack.isCancel(value)) {
    clack.cancel('Bootstrap cancelled.');
    process.exit(130);
  }
  return value;
};

export const askName = async (current: string | undefined): Promise<string> => {
  if (current !== undefined) return current;
  const value = await clack.text({
    message: 'Project name?',
    placeholder: 'my-project',
    validate: (input: string) => {
      const result = validateName(input);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
  });
  return cancelIfNeeded(value);
};

export const askDescription = async (current: string | undefined): Promise<string> => {
  if (current !== undefined) return current;
  const value = await clack.text({
    message: 'Short description? (optional)',
    placeholder: '',
    defaultValue: '',
  });
  return cancelIfNeeded(value);
};

export const askLanguages = async (
  current: Options['languages'] | undefined,
): Promise<Options['languages']> => {
  if (current !== undefined) return current;
  const value = await clack.multiselect({
    message: 'Which languages?',
    options: [
      { value: 'typescript', label: 'TypeScript' },
      { value: 'rust', label: 'Rust' },
      { value: 'python', label: 'Python' },
    ],
    required: true,
  });
  return cancelIfNeeded(value) as Options['languages'];
};

export const askMonorepo = async (
  current: Options['monorepo'] | undefined,
  languages: Options['languages'],
): Promise<Options['monorepo']> => {
  if (current !== undefined) return current;
  if (!languages.includes('typescript') && languages.length === 1) return 'none';
  const isPolyglot = languages.length > 1;
  const value = await clack.select({
    message: isPolyglot ? 'Polyglot monorepo tool?' : 'Use a monorepo?',
    options: [
      { value: 'turbo', label: 'Turborepo' },
      { value: 'nx', label: 'Nx' },
      ...(isPolyglot ? [] : [{ value: 'none', label: 'No, single-package' }]),
    ],
    initialValue: isPolyglot ? 'turbo' : 'none',
  });
  return cancelIfNeeded(value) as Options['monorepo'];
};

export const askPackageManager = async (
  current: Options['packageManager'] | undefined,
  languages: Options['languages'],
): Promise<Options['packageManager']> => {
  if (current !== undefined) return current;
  if (!languages.includes('typescript')) return 'pnpm';
  const value = await clack.select({
    message: 'Package manager?',
    options: [
      { value: 'pnpm', label: 'pnpm' },
      { value: 'bun', label: 'bun' },
    ],
    initialValue: 'pnpm',
  });
  return cancelIfNeeded(value) as Options['packageManager'];
};

export const askBunTest = async (
  current: Options['bunTest'] | undefined,
  packageManager: Options['packageManager'],
  languages: Options['languages'],
): Promise<Options['bunTest']> => {
  if (current !== undefined) return current;
  if (!languages.includes('typescript') || packageManager !== 'bun') return 'vitest';
  const value = await clack.select({
    message: 'Test runner?',
    options: [
      { value: 'vitest', label: 'vitest (via Vite+)' },
      { value: 'bun', label: 'bun:test' },
      { value: 'both', label: 'both' },
    ],
    initialValue: 'vitest',
  });
  return cancelIfNeeded(value) as Options['bunTest'];
};

export const askCi = async (current: boolean | undefined): Promise<boolean> => {
  if (current !== undefined) return current;
  const value = await clack.confirm({
    message: 'Add GitHub Actions CI?',
    initialValue: false,
  });
  return cancelIfNeeded(value);
};

export const askGithub = async (current: boolean | undefined, ghAvailable: boolean): Promise<boolean> => {
  if (current !== undefined) return current;
  if (!ghAvailable) return false;
  const value = await clack.confirm({
    message: 'Create a GitHub repo via `gh`?',
    initialValue: false,
  });
  return cancelIfNeeded(value);
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/prompts/questions.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `src/prompts/index.ts`**

```ts
import * as clack from '@clack/prompts';
import type { Options, PartialOptions } from '../options.js';
import { OptionsSchema } from '../options.js';
import { which } from '../util/exec.js';
import {
  applyDefaults,
  askBunTest,
  askCi,
  askDescription,
  askGithub,
  askLanguages,
  askMonorepo,
  askName,
  askPackageManager,
} from './questions.js';

export type RunPromptsOptions = {
  nonInteractive: boolean;
  yes: boolean;
};

export const runPrompts = async (
  partial: PartialOptions,
  { nonInteractive, yes }: RunPromptsOptions,
): Promise<Options> => {
  if (nonInteractive || yes) {
    const filled = applyDefaults(partial);
    const result = OptionsSchema.safeParse(filled);
    if (!result.success) {
      const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
      throw new Error(`Cannot run non-interactively — missing required fields: ${missing}`);
    }
    return result.data;
  }

  clack.intro('create-workspace');

  const name = await askName(partial.name);
  const description = await askDescription(partial.description);
  const languages = await askLanguages(partial.languages);
  const monorepo = await askMonorepo(partial.monorepo, languages);
  const packageManager = await askPackageManager(partial.packageManager, languages);
  const bunTest = await askBunTest(partial.bunTest, packageManager, languages);
  const ci = await askCi(partial.ci);
  const ghAvailable = await which('gh');
  const github = await askGithub(partial.github, ghAvailable);

  const filled = applyDefaults({
    ...partial,
    name,
    description,
    languages,
    monorepo,
    packageManager,
    bunTest,
    ci,
    github,
  });

  const result = OptionsSchema.parse(filled);
  clack.outro('Got it — scaffolding…');
  return result;
};
```

- [ ] **Step 6: Run all tests**

Run: `pnpm test`
Expected: all PASS.

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/prompts/
git commit -m "feat(prompts): add clack-based interactive prompts"
```

---

## Task 10: CLI parser (citty)

The top-level command definition. Maps flags to a `PartialOptions`. Handles `-h` and `-v`.

**Files:**
- Create: `src/cli.ts` (replaces the stub from Task 1)

- [ ] **Step 1: Replace `src/cli.ts`**

```ts
#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import type { Language, PartialOptions } from './options.js';
import { run } from './run.js';
import { VERSION } from './index.js';

const main = defineCommand({
  meta: {
    name: 'create-workspace',
    version: VERSION,
    description: 'Scaffold a new workspace with modern TS/Rust/Python tooling.',
  },
  args: {
    name: {
      type: 'positional',
      required: false,
      description: 'Project name (also accepted via --name)',
    },
    description: { type: 'string', description: 'Short project description' },
    cwd: { type: 'string', alias: 'C', description: 'Working directory (default: cwd)' },
    language: {
      type: 'string',
      description: 'Language(s): typescript, rust, python (repeatable, comma-separated also OK)',
    },
    monorepo: { type: 'string', description: 'turbo | nx | none' },
    'package-manager': { type: 'string', description: 'pnpm | bun (TS only)' },
    'bun-test': { type: 'string', description: 'vitest | bun | both (TS+bun only)' },
    'rust-workspace': { type: 'boolean', description: 'Use a Cargo workspace' },
    'no-rust-workspace': { type: 'boolean' },
    'python-workspace': { type: 'boolean', description: 'Use a uv workspace' },
    'no-python-workspace': { type: 'boolean' },
    ci: { type: 'boolean', description: 'Add GitHub Actions CI' },
    'no-ci': { type: 'boolean' },
    github: { type: 'boolean', description: 'Create a GitHub repo via gh' },
    'no-github': { type: 'boolean' },
    'github-visibility': { type: 'string', description: 'public | private | internal' },
    'github-owner': { type: 'string', description: 'GitHub owner (org or user)' },
    git: { type: 'boolean', description: 'Run git init (default: true)' },
    'no-git': { type: 'boolean' },
    commit: { type: 'boolean', description: 'Create initial commit (default: true)' },
    'no-commit': { type: 'boolean' },
    install: { type: 'boolean', description: 'Install deps after scaffold (default: true)' },
    'no-install': { type: 'boolean' },
    yes: { type: 'boolean', alias: 'y', description: 'Accept all defaults, skip prompts' },
    'non-interactive': { type: 'boolean', description: 'Fail if any required field is missing' },
    verbose: { type: 'boolean', description: 'Verbose logging' },
  },
  async run({ args }) {
    const flagsAsPartial = parseFlags(args);
    await run(flagsAsPartial, {
      nonInteractive: Boolean(args['non-interactive']),
      yes: Boolean(args.yes),
    });
  },
});

const parseLanguages = (value: string | string[] | undefined): Language[] | undefined => {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const flat = raw.flatMap((v) => v.split(','));
  const valid: Language[] = [];
  for (const item of flat) {
    const trimmed = item.trim();
    if (trimmed === 'typescript' || trimmed === 'rust' || trimmed === 'python') {
      valid.push(trimmed);
    } else if (trimmed !== '') {
      throw new Error(`Unknown language: ${trimmed}`);
    }
  }
  return valid.length > 0 ? valid : undefined;
};

const boolFromPair = (
  enable: unknown,
  disable: unknown,
  defaultValue: boolean | undefined,
): boolean | undefined => {
  if (enable === true) return true;
  if (disable === true) return false;
  return defaultValue;
};

const parseFlags = (args: Record<string, unknown>): PartialOptions => {
  const partial: PartialOptions = {
    cwd: (typeof args.cwd === 'string' && args.cwd) || process.cwd(),
  };
  if (typeof args.name === 'string' && args.name.length > 0) partial.name = args.name;
  if (typeof args.description === 'string') partial.description = args.description;
  const languages = parseLanguages(args.language as string | string[] | undefined);
  if (languages) partial.languages = languages;
  if (args.monorepo === 'turbo' || args.monorepo === 'nx' || args.monorepo === 'none') {
    partial.monorepo = args.monorepo;
  }
  if (args['package-manager'] === 'pnpm' || args['package-manager'] === 'bun') {
    partial.packageManager = args['package-manager'];
  }
  if (
    args['bun-test'] === 'vitest' ||
    args['bun-test'] === 'bun' ||
    args['bun-test'] === 'both'
  ) {
    partial.bunTest = args['bun-test'];
  }
  const rw = boolFromPair(args['rust-workspace'], args['no-rust-workspace'], undefined);
  if (rw !== undefined) partial.rustWorkspace = rw;
  const pw = boolFromPair(args['python-workspace'], args['no-python-workspace'], undefined);
  if (pw !== undefined) partial.pythonWorkspace = pw;
  const ci = boolFromPair(args.ci, args['no-ci'], undefined);
  if (ci !== undefined) partial.ci = ci;
  const gh = boolFromPair(args.github, args['no-github'], undefined);
  if (gh !== undefined) partial.github = gh;
  if (
    args['github-visibility'] === 'public' ||
    args['github-visibility'] === 'private' ||
    args['github-visibility'] === 'internal'
  ) {
    partial.githubVisibility = args['github-visibility'];
  }
  if (typeof args['github-owner'] === 'string') partial.githubOwner = args['github-owner'];
  const git = boolFromPair(args.git, args['no-git'], undefined);
  if (git !== undefined) partial.git = git;
  const commit = boolFromPair(args.commit, args['no-commit'], undefined);
  if (commit !== undefined) partial.commit = commit;
  const install = boolFromPair(args.install, args['no-install'], undefined);
  if (install !== undefined) partial.install = install;
  if (args.verbose === true) partial.verbose = true;
  return partial;
};

runMain(main);
```

- [ ] **Step 2: Verify help output**

Run: `pnpm dev -- --help`
Expected: prints citty's auto-generated help with all flags listed.

- [ ] **Step 3: Verify version output**

Run: `pnpm dev -- --version`
Expected: prints `0.0.1`.

- [ ] **Step 4: Commit**

```bash
git add src/cli.ts
git commit -m "feat(cli): add citty-based argument parser"
```

---

## Task 11: Orchestrator (`run.ts`)

The top-level glue: prompts → validate → buildPlan → executePlan → post.

**Files:**
- Create: `src/run.ts`

- [ ] **Step 1: Implement `src/run.ts`**

```ts
import { existsSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { exec as nodeExec } from './util/exec.js';
import { createLogger } from './util/log.js';
import type { Options, PartialOptions } from './options.js';
import { runPrompts, type RunPromptsOptions } from './prompts/index.js';
import { buildPlan } from './plan/index.js';
import { sharedContributor } from './plan/contributors/shared.js';
import { tsContributor } from './plan/contributors/languages/ts.js';
import { executePlan } from './scaffold/index.js';
import { runGit } from './post/git.js';
import { runInstall } from './post/install.js';

const detectAuthor = async (cwd: string): Promise<{ name: string; email: string }> => {
  const nameResult = await nodeExec('git', ['config', 'user.name'], { cwd });
  const emailResult = await nodeExec('git', ['config', 'user.email'], { cwd });
  return {
    name: nameResult.stdout.trim(),
    email: emailResult.stdout.trim(),
  };
};

const validateCwdAndTarget = (cwd: string, name: string): string => {
  const absCwd = isAbsolute(cwd) ? cwd : resolve(process.cwd(), cwd);
  if (!existsSync(absCwd) || !statSync(absCwd).isDirectory()) {
    throw new Error(`cwd does not exist or is not a directory: ${absCwd}`);
  }
  const target = join(absCwd, name);
  if (existsSync(target)) {
    throw new Error(`Target directory already exists: ${target}`);
  }
  return target;
};

export const run = async (partial: PartialOptions, promptOpts: RunPromptsOptions): Promise<void> => {
  const log = createLogger(Boolean(partial.verbose));

  const isTty = process.stdin.isTTY === true;
  const effective: RunPromptsOptions = {
    nonInteractive: promptOpts.nonInteractive || !isTty,
    yes: promptOpts.yes,
  };

  const opts: Options = await runPrompts(partial, effective);
  const targetDir = validateCwdAndTarget(opts.cwd, opts.name);

  const author = await detectAuthor(opts.cwd);

  const plan = buildPlan(opts, [sharedContributor, tsContributor]);

  log.info(`Scaffolding ${opts.name} → ${targetDir}`);
  await executePlan(plan, targetDir, opts, { author });
  log.success(`Wrote ${plan.files.length} files.`);

  if (opts.git) {
    await runGit(targetDir, opts, log);
  }
  if (opts.install) {
    await runInstall(targetDir, opts, log);
  }

  log.success(`Done. cd ${opts.name}`);
};
```

- [ ] **Step 2: Run check (will fail on missing post imports)**

Run: `pnpm check`
Expected: FAIL — `./post/git.js` and `./post/install.js` not found. We'll add them in Tasks 12 and 13.

- [ ] **Step 3: Commit a stub `post/` to keep the tree compiling between tasks**

Create `src/post/git.ts`:

```ts
import type { Options } from '../options.js';
import type { Logger } from '../util/log.js';

export const runGit = async (_targetDir: string, _opts: Options, log: Logger): Promise<void> => {
  log.debug('git step: stub (filled in Task 12)');
};
```

Create `src/post/install.ts`:

```ts
import type { Options } from '../options.js';
import type { Logger } from '../util/log.js';

export const runInstall = async (_targetDir: string, _opts: Options, log: Logger): Promise<void> => {
  log.debug('install step: stub (filled in Task 13)');
};
```

- [ ] **Step 4: Verify check passes**

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/run.ts src/post/
git commit -m "feat(run): add orchestrator with stub post-scaffold steps"
```

---

## Task 12: Post-scaffold — git init + first commit

Real implementation of `runGit`.

**Files:**
- Modify: `src/post/git.ts`
- Create: `src/post/git.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/post/git.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Options } from '../options.js';
import { exec } from '../util/exec.js';
import { createLogger } from '../util/log.js';
import { runGit } from './git.js';

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

const log = createLogger(false);

describe('runGit', () => {
  it('initializes a git repo and creates an initial commit', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'git-test-'));
    writeFileSync(join(dir, 'README.md'), '# foo');
    await runGit(dir, baseOptions, log);

    const status = await exec('git', ['log', '--oneline'], { cwd: dir });
    expect(status.code).toBe(0);
    expect(status.stdout).toContain('chore: initial commit');
  });

  it('initializes but does not commit when commit: false', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'git-test-'));
    writeFileSync(join(dir, 'README.md'), '# foo');
    await runGit(dir, { ...baseOptions, commit: false }, log);

    const status = await exec('git', ['log', '--oneline'], { cwd: dir });
    expect(status.code).not.toBe(0); // no commits
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/post/git.test.ts`
Expected: FAIL — runGit is a stub.

- [ ] **Step 3: Implement `src/post/git.ts`**

```ts
import type { Options } from '../options.js';
import { exec } from '../util/exec.js';
import type { Logger } from '../util/log.js';

export const runGit = async (targetDir: string, opts: Options, log: Logger): Promise<void> => {
  log.info('Initializing git repo…');
  const init = await exec('git', ['init', '-q'], { cwd: targetDir });
  if (init.code !== 0) {
    log.error(`git init failed: ${init.stderr}`);
    return;
  }

  if (!opts.commit) {
    log.debug('Skipping initial commit (commit: false)');
    return;
  }

  const add = await exec('git', ['add', '.'], { cwd: targetDir });
  if (add.code !== 0) {
    log.error(`git add failed: ${add.stderr}`);
    return;
  }

  const commit = await exec('git', ['commit', '-q', '-m', 'chore: initial commit'], {
    cwd: targetDir,
  });
  if (commit.code !== 0) {
    log.error(`git commit failed: ${commit.stderr}`);
    return;
  }
  log.success('Initial commit created.');
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/post/git.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/post/git.ts src/post/git.test.ts
git commit -m "feat(post): implement git init + initial commit"
```

---

## Task 13: Post-scaffold — install + hooks

Runs the appropriate install command and Vite+ hook setup.

**Files:**
- Modify: `src/post/install.ts`

- [ ] **Step 1: Implement `src/post/install.ts`**

```ts
import type { Options } from '../options.js';
import { exec, which } from '../util/exec.js';
import type { Logger } from '../util/log.js';

export const runInstall = async (
  targetDir: string,
  opts: Options,
  log: Logger,
): Promise<void> => {
  if (!opts.languages.includes('typescript')) {
    log.debug('No TS in languages — skipping TS install step.');
    return;
  }

  const pm = opts.packageManager;
  if (!(await which(pm))) {
    log.warn(`${pm} not found on PATH — skipping install. Run \`${pm} install\` manually.`);
    return;
  }

  log.info(`Running ${pm} install…`);
  const install = await exec(pm, ['install'], { cwd: targetDir, inherit: true });
  if (install.code !== 0) {
    log.error(`${pm} install failed (exit ${install.code}).`);
    return;
  }

  const usingVitePlus = !(pm === 'bun' && opts.bunTest === 'bun');
  if (usingVitePlus) {
    log.info('Installing Vite+ commit hooks…');
    const hooks = await exec(pm === 'pnpm' ? 'pnpm' : 'bun', ['exec', 'vp', 'config'], {
      cwd: targetDir,
      inherit: true,
    });
    if (hooks.code !== 0) {
      log.warn(`vp config exited ${hooks.code} — hooks may not be installed.`);
    }
  }
};
```

- [ ] **Step 2: Verify check passes**

Run: `pnpm check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/post/install.ts
git commit -m "feat(post): implement install + Vite+ hook setup"
```

---

## Task 14: End-to-end integration test

Scaffold a TS-only project into a tmpdir using the full pipeline and verify the output is a valid project.

**Files:**
- Create: `tests/integration/ts-end-to-end.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/ts-end-to-end.test.ts`:

```ts
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Options } from '../../src/options.js';
import { buildPlan } from '../../src/plan/index.js';
import { sharedContributor } from '../../src/plan/contributors/shared.js';
import { tsContributor } from '../../src/plan/contributors/languages/ts.js';
import { executePlan } from '../../src/scaffold/index.js';

const opts: Options = {
  name: 'demo-app',
  description: 'A demo',
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

describe('TS-only end-to-end scaffold', () => {
  it('produces a complete project structure', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'e2e-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, target, { ...opts, cwd });

    const expectedFiles = [
      'README.md',
      'AGENTS.md',
      'CLAUDE.md',
      '.editorconfig',
      'mise.toml',
      '.gitignore',
      'tsconfig.json',
      '.oxlintrc.json',
      '.oxfmtrc.json',
      'package.json',
      'vite.config.ts',
      'src/index.ts',
      'tests/smoke.test.ts',
    ];
    for (const file of expectedFiles) {
      expect(existsSync(join(target, file)), `missing: ${file}`).toBe(true);
    }
  });

  it('package.json is valid JSON with the expected fields', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'e2e-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, target, { ...opts, cwd });

    const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')) as {
      name: string;
      type: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.name).toBe('demo-app');
    expect(pkg.type).toBe('module');
    expect(pkg.devDependencies['vite-plus']).toBeDefined();
    expect(pkg.devDependencies.typescript).toBeDefined();
  });

  it('README.md interpolates the project name', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'e2e-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, target, { ...opts, cwd });

    const readme = readFileSync(join(target, 'README.md'), 'utf8');
    expect(readme).toContain('# demo-app');
  });

  it('vite.config.ts contains the staged block', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'e2e-'));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, target, { ...opts, cwd });

    const viteConfig = readFileSync(join(target, 'vite.config.ts'), 'utf8');
    expect(viteConfig).toContain('staged:');
    expect(viteConfig).toContain('vp check --fix');
  });
});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test tests/integration/ts-end-to-end.test.ts`
Expected: PASS — the pipeline already produces valid output.

- [ ] **Step 3: Run the full quality gate**

Run: `pnpm check && pnpm test`
Expected: both PASS.

- [ ] **Step 4: Manual sanity check — run the CLI**

Run:
```bash
mkdir -p /tmp/cw-smoke && pnpm dev -- smoke-test \
  --cwd /tmp/cw-smoke \
  --language typescript \
  --description "Smoke test" \
  --no-git --no-install --yes
```
Expected: prints `Wrote N files`, creates `/tmp/cw-smoke/smoke-test/` with the full project tree.

Run:
```bash
ls /tmp/cw-smoke/smoke-test
cat /tmp/cw-smoke/smoke-test/package.json
```
Expected: shows all expected files; package.json has `name: "smoke-test"`.

Cleanup:
```bash
rm -rf /tmp/cw-smoke
```

- [ ] **Step 5: Commit**

```bash
git add tests/integration/
git commit -m "test: add TS-only end-to-end integration test"
```

---

## Self-review checklist (after implementation, before declaring Plan 1 done)

- [ ] `pnpm check` passes
- [ ] `pnpm test` passes (unit + integration)
- [ ] `pnpm dev -- --help` prints the full options table
- [ ] `pnpm dev -- foo --language typescript --yes --cwd /tmp` produces a working TS project
- [ ] The produced project, after `pnpm install`, can run `pnpm check` and `pnpm test` cleanly
- [ ] No `TODO`/`FIXME`/`TBD` markers introduced
- [ ] No half-wired contributors (Rust/Python/Polyglot/CI/GitHub are explicitly deferred to Plans 2 and 3)

## What's next (Plans 2 and 3)

- **Plan 2** adds `rustContributor`, `pythonContributor`, polyglot layout logic, and the GitHub Actions workflow templates for each language combo.
- **Plan 3** adds the `runGithub` post-step (using `gh repo create`/connect) and the CI workflow contributor wiring.
