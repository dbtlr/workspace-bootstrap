import { describe, expect, it } from "vitest";
import type { Options } from "../../options.js";
import { renderMonorepoPackageJson } from "./monorepoPackageJson.js";

const baseOptions: Options = {
  name: "my-mono",
  description: "Polyglot project",
  cwd: "/tmp",
  languages: ["typescript", "rust"],
  packageManager: "pnpm",
  bunTest: "vitest",
  monorepo: "turbo",
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

describe("renderMonorepoPackageJson", () => {
  it("emits a name and private:true", () => {
    const json = renderMonorepoPackageJson(baseOptions);
    const parsed = JSON.parse(json) as { name: string; private: boolean };
    expect(parsed.name).toBe("my-mono");
    expect(parsed.private).toBe(true);
  });

  it("includes a workspaces array for bun", () => {
    const json = renderMonorepoPackageJson({ ...baseOptions, packageManager: "bun" });
    const parsed = JSON.parse(json) as { workspaces: string[] };
    expect(parsed.workspaces).toEqual(["apps/*", "packages/*"]);
  });

  it("omits workspaces for pnpm (since pnpm-workspace.yaml is separate)", () => {
    const json = renderMonorepoPackageJson(baseOptions);
    const parsed = JSON.parse(json) as { workspaces?: string[] };
    expect(parsed.workspaces).toBeUndefined();
  });

  it("includes turbo as a devDependency when monorepo is turbo", () => {
    const json = renderMonorepoPackageJson(baseOptions);
    const parsed = JSON.parse(json) as { devDependencies: Record<string, string> };
    expect(parsed.devDependencies.turbo).toBeDefined();
  });

  it("includes nx as a devDependency when monorepo is nx", () => {
    const json = renderMonorepoPackageJson({ ...baseOptions, monorepo: "nx" });
    const parsed = JSON.parse(json) as { devDependencies: Record<string, string> };
    expect(parsed.devDependencies.nx).toBeDefined();
    expect(parsed.devDependencies.turbo).toBeUndefined();
  });

  it("sets packageManager based on options", () => {
    const pnpm = JSON.parse(renderMonorepoPackageJson(baseOptions)) as { packageManager: string };
    expect(pnpm.packageManager).toMatch(/^pnpm@/);
    const bun = JSON.parse(
      renderMonorepoPackageJson({ ...baseOptions, packageManager: "bun" }),
    ) as { packageManager: string };
    expect(bun.packageManager).toMatch(/^bun@/);
  });
});
