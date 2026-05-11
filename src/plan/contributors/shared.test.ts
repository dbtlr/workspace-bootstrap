import { describe, expect, it } from "vitest";
import type { Options } from "../../options.js";
import { sharedContributor } from "./shared.js";

const baseOptions: Options = {
  name: "foo",
  description: "My project",
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

describe("sharedContributor", () => {
  it("contributes README, AGENTS.md, .editorconfig, mise.toml, .gitignore", () => {
    const contribution = sharedContributor(baseOptions);
    const targets = contribution.files.map((f) => f.target);
    expect(targets).toContain("README.md");
    expect(targets).toContain("AGENTS.md");
    expect(targets).toContain("CLAUDE.md");
    expect(targets).toContain(".editorconfig");
    expect(targets).toContain("mise.toml");
    expect(targets).toContain(".gitignore");
  });

  it("builds .gitignore from shared fragment plus per-language fragments", () => {
    const ts = sharedContributor({ ...baseOptions, languages: ["typescript"] });
    const tsGitignore = ts.files.find((f) => f.target === ".gitignore");
    expect(tsGitignore?.content).toContain("node_modules/");
    expect(tsGitignore?.content).toContain(".worktrees/");
  });

  it("emits CLAUDE.md as a symlink marker", () => {
    const contribution = sharedContributor(baseOptions);
    const claude = contribution.files.find((f) => f.target === "CLAUDE.md");
    expect(claude?.content).toBe("@AGENTS.md\n");
    expect(claude?.raw).toBe(true);
  });
});
