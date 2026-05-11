import { describe, expect, it } from "vitest";
import type { Options } from "../../options.js";
import type { PkgDeps } from "../../plan/contributors.js";
import { renderPackageJson } from "./packageJson.js";

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

describe("renderPackageJson", () => {
  it("produces a valid JSON string", () => {
    const deps: PkgDeps = { dependencies: { zod: "^4.0.0" }, scripts: {} };
    const json = renderPackageJson(baseOptions, deps);
    const parsed = JSON.parse(json) as {
      name: string;
      type: string;
      dependencies: Record<string, string>;
    };
    expect(parsed.name).toBe("foo");
    expect(parsed.type).toBe("module");
    expect(parsed.dependencies.zod).toBe("^4.0.0");
  });

  it("includes the description", () => {
    const json = renderPackageJson({ ...baseOptions, description: "A thing" }, {});
    const parsed = JSON.parse(json) as { description: string };
    expect(parsed.description).toBe("A thing");
  });

  it("sets packageManager based on options", () => {
    const pnpm = JSON.parse(renderPackageJson(baseOptions, {})) as { packageManager: string };
    expect(pnpm.packageManager).toMatch(/^pnpm@/);
    const bun = JSON.parse(renderPackageJson({ ...baseOptions, packageManager: "bun" }, {})) as {
      packageManager: string;
    };
    expect(bun.packageManager).toMatch(/^bun@/);
  });

  it("adds bun:test script when bunTest is bun or both", () => {
    const bothOpts: Options = { ...baseOptions, packageManager: "bun", bunTest: "both" };
    const parsed = JSON.parse(renderPackageJson(bothOpts, {})) as {
      scripts: Record<string, string>;
    };
    expect(parsed.scripts["test:bun"]).toBe("bun test");
  });
});
