import { describe, expect, it } from "vitest";
import type { Options } from "../../options.js";
import { monorepoContributor } from "./monorepo.js";

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

describe("monorepoContributor", () => {
  it("returns empty when monorepo is none", () => {
    const contribution = monorepoContributor(baseOptions);
    expect(contribution.files).toHaveLength(0);
  });

  it("emits turbo.json + root package.json + pnpm-workspace.yaml for turbo + pnpm", () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: "turbo" });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain("turbo.json");
    expect(targets).toContain("package.json");
    expect(targets).toContain("pnpm-workspace.yaml");
  });

  it("omits pnpm-workspace.yaml when packageManager is bun", () => {
    const contribution = monorepoContributor({
      ...baseOptions,
      monorepo: "turbo",
      packageManager: "bun",
    });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain("turbo.json");
    expect(targets).toContain("package.json");
    expect(targets).not.toContain("pnpm-workspace.yaml");
  });

  it("emits nx.json for nx mode", () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: "nx" });
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain("nx.json");
    expect(targets).not.toContain("turbo.json");
  });

  it("root package.json is generated content (not a template)", () => {
    const contribution = monorepoContributor({ ...baseOptions, monorepo: "turbo" });
    const pkg = contribution.files.find((f) => f.target === "package.json");
    expect(pkg?.content).toBeDefined();
    expect(pkg?.raw).toBe(true);
  });
});
