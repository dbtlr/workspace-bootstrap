import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Options } from "../../src/options.js";
import { buildPlan } from "../../src/plan/index.js";
import { sharedContributor } from "../../src/plan/contributors/shared.js";
import { tsContributor } from "../../src/plan/contributors/languages/ts.js";
import { executePlan } from "../../src/scaffold/index.js";

const opts: Options = {
  name: "demo-app",
  description: "A demo",
  cwd: "/tmp",
  languages: ["typescript"],
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

describe("TS-only end-to-end scaffold", () => {
  it("produces a complete project structure", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "e2e-"));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, target, { ...opts, cwd });

    const expectedFiles = [
      "README.md",
      "AGENTS.md",
      "CLAUDE.md",
      ".editorconfig",
      "mise.toml",
      ".gitignore",
      "tsconfig.json",
      ".oxlintrc.json",
      ".oxfmtrc.json",
      "package.json",
      "vite.config.ts",
      "src/index.ts",
      "tests/smoke.test.ts",
    ];
    for (const file of expectedFiles) {
      expect(existsSync(join(target, file)), `missing: ${file}`).toBe(true);
    }
  });

  it("package.json is valid JSON with the expected fields", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "e2e-"));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, target, { ...opts, cwd });

    const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8")) as {
      name: string;
      type: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.name).toBe("demo-app");
    expect(pkg.type).toBe("module");
    expect(pkg.devDependencies["vite-plus"]).toBeDefined();
    expect(pkg.devDependencies.typescript).toBeDefined();
  });

  it("README.md interpolates the project name", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "e2e-"));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, target, { ...opts, cwd });

    const readme = readFileSync(join(target, "README.md"), "utf8");
    expect(readme).toContain("# demo-app");
  });

  it("vite.config.ts contains the staged block", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "e2e-"));
    const target = join(cwd, opts.name);
    const plan = buildPlan({ ...opts, cwd }, [sharedContributor, tsContributor]);
    await executePlan(plan, target, { ...opts, cwd });

    const viteConfig = readFileSync(join(target, "vite.config.ts"), "utf8");
    expect(viteConfig).toContain("staged:");
    expect(viteConfig).toContain("vp check --fix");
  });
});
