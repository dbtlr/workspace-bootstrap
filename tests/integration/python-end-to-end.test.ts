import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Options } from "../../src/options.js";
import { sharedContributor } from "../../src/plan/contributors/shared.js";
import { monorepoContributor } from "../../src/plan/contributors/monorepo.js";
import { pythonContributor } from "../../src/plan/contributors/languages/python.js";
import { buildPlan } from "../../src/plan/index.js";
import { executePlan } from "../../src/scaffold/index.js";

const baseOpts: Options = {
  name: "pythy",
  description: "A Python demo",
  cwd: "/tmp",
  languages: ["python"],
  packageManager: "pnpm",
  bunTest: "vitest",
  monorepo: "none",
  rustWorkspace: false,
  pythonWorkspace: false,
  ci: false,
  github: false,
  githubVisibility: "private",
  git: true,
  commit: true,
  install: true,
  verbose: false,
};

const contributors = [sharedContributor, monorepoContributor, pythonContributor];

describe("Python-only end-to-end scaffold", () => {
  it("single-package produces pyproject + src/<name>/", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "py-single-"));
    const target = join(cwd, baseOpts.name);
    const plan = buildPlan({ ...baseOpts, cwd }, contributors);
    await executePlan(plan, target, { ...baseOpts, cwd });

    expect(existsSync(join(target, "pyproject.toml"))).toBe(true);
    expect(existsSync(join(target, "ruff.toml"))).toBe(true);
    expect(existsSync(join(target, "src/pythy/__init__.py"))).toBe(true);
    expect(existsSync(join(target, "tests/test_smoke.py"))).toBe(true);
  });

  it("underscores hyphenated names in the module path", async () => {
    const opts: Options = { ...baseOpts, name: "my-py-app" };
    const cwd = mkdtempSync(join(tmpdir(), "py-hyphen-"));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    expect(existsSync(join(target, "src/my_py_app/__init__.py"))).toBe(true);
  });

  it("workspace mode produces workspace pyproject + packages/<name>/", async () => {
    const opts: Options = { ...baseOpts, pythonWorkspace: true };
    const cwd = mkdtempSync(join(tmpdir(), "py-ws-"));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    const rootPy = readFileSync(join(target, "pyproject.toml"), "utf8");
    expect(rootPy).toContain("[tool.uv.workspace]");
    expect(rootPy).toContain('members = ["packages/*"]');
    expect(existsSync(join(target, "packages/pythy/pyproject.toml"))).toBe(true);
    expect(existsSync(join(target, "packages/pythy/src/pythy/__init__.py"))).toBe(true);
  });

  it("polyglot + pythonWorkspace uses py/* members glob (not packages/*)", async () => {
    const opts: Options = {
      ...baseOpts,
      languages: ["typescript", "python"],
      monorepo: "turbo",
      pythonWorkspace: true,
    };
    const cwd = mkdtempSync(join(tmpdir(), "py-poly-ws-"));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, contributors);
    await executePlan(plan, target, { ...opts, cwd });

    const rootPy = readFileSync(join(target, "pyproject.toml"), "utf8");
    expect(rootPy).toContain('members = ["py/*"]');
    expect(rootPy).not.toContain("packages/*");
  });
});
