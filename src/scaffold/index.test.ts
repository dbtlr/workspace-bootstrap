import { lstatSync, mkdtempSync, readFileSync, readlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Options } from "../options.js";
import type { Plan } from "../plan/contributors.js";
import { executePlan } from "./index.js";

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

describe("executePlan", () => {
  it("writes raw-content files into the target directory", async () => {
    const targetDir = mkdtempSync(join(tmpdir(), "exec-plan-"));
    const plan: Plan = {
      files: [
        { target: "README.md", content: "# foo\n", raw: true },
        { target: "config/app.json", content: "{}\n", raw: true },
      ],
      postSteps: [],
      deps: {},
    };
    await executePlan(plan, targetDir, baseOptions);
    expect(readFileSync(join(targetDir, "README.md"), "utf8")).toBe("# foo\n");
    expect(readFileSync(join(targetDir, "config/app.json"), "utf8")).toBe("{}\n");
  });

  it("creates nested directories as needed", async () => {
    const targetDir = mkdtempSync(join(tmpdir(), "exec-plan-"));
    const plan: Plan = {
      files: [{ target: "src/util/foo.ts", content: "export {}", raw: true }],
      postSteps: [],
      deps: {},
    };
    await executePlan(plan, targetDir, baseOptions);
    expect(readFileSync(join(targetDir, "src/util/foo.ts"), "utf8")).toBe("export {}");
  });

  it("creates CLAUDE.md as a symlink to AGENTS.md", async () => {
    const targetDir = mkdtempSync(join(tmpdir(), "exec-plan-"));
    const plan: Plan = {
      files: [
        { target: "AGENTS.md", content: "# AGENTS\n", raw: true },
        { target: "CLAUDE.md", content: "@AGENTS.md\n", raw: true },
      ],
      postSteps: [],
      deps: {},
    };
    await executePlan(plan, targetDir, baseOptions);

    const claudeMdPath = join(targetDir, "CLAUDE.md");
    const stat = lstatSync(claudeMdPath);
    if (stat.isSymbolicLink()) {
      const target = readlinkSync(claudeMdPath);
      expect(target).toBe("AGENTS.md");
    } else {
      // Symlink fallback path — confirm the file has the import-syntax content.
      expect(readFileSync(claudeMdPath, "utf8")).toBe("@AGENTS.md\n");
    }
  });
});
