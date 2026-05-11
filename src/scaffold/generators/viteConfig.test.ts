import { describe, expect, it } from "vitest";
import type { Options } from "../../options.js";
import { renderViteConfig } from "./viteConfig.js";

const baseOptions: Options = {
  name: "foo",
  description: "",
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

describe("renderViteConfig", () => {
  it("includes the defineConfig import and call", () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain("import { defineConfig } from 'vite-plus'");
    expect(out).toContain("defineConfig(");
  });

  it("includes a staged block by default", () => {
    const out = renderViteConfig(baseOptions);
    expect(out).toContain("staged:");
    expect(out).toContain("vp check --fix");
  });

  it("omits the staged block when bunTest is bun-only (no vp)", () => {
    const out = renderViteConfig({ ...baseOptions, packageManager: "bun", bunTest: "bun" });
    expect(out).not.toContain("staged:");
  });
});
