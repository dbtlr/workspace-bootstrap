import { describe, expect, it } from "vitest";
import type { Options } from "../../../options.js";
import { tsContributor } from "./ts.js";

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

describe("tsContributor", () => {
  it("returns empty contribution when TypeScript is not in languages", () => {
    const contribution = tsContributor({ ...baseOptions, languages: ["rust"] });
    expect(contribution.files).toHaveLength(0);
  });

  it("contributes tsconfig, oxlint, oxfmt, package.json, vite.config.ts, src, test", () => {
    const contribution = tsContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain("tsconfig.json");
    expect(targets).toContain(".oxlintrc.json");
    expect(targets).toContain(".oxfmtrc.json");
    expect(targets).toContain("package.json");
    expect(targets).toContain("vite.config.ts");
    expect(targets).toContain("src/index.ts");
    expect(targets).toContain("tests/smoke.test.ts");
  });

  it("package.json content reflects the project name and pnpm", () => {
    const contribution = tsContributor(baseOptions);
    const pkg = contribution.files.find((f) => f.target === "package.json");
    expect(pkg?.content).toContain('"name": "foo"');
    expect(pkg?.content).toContain("pnpm@");
  });
});
