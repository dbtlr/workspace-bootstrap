import { describe, expect, it } from "vitest";
import type { Options } from "../options.js";
import { getSubPath, isPolyglot } from "./sub-paths.js";

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

describe("isPolyglot", () => {
  it("returns false for single language", () => {
    expect(isPolyglot(baseOptions)).toBe(false);
  });

  it("returns true for 2+ languages", () => {
    expect(isPolyglot({ ...baseOptions, languages: ["typescript", "rust"] })).toBe(true);
  });
});

describe("getSubPath", () => {
  it("returns empty string for TS without monorepo", () => {
    expect(getSubPath("typescript", baseOptions)).toBe("");
  });

  it("returns apps/<name> for TS in monorepo", () => {
    expect(getSubPath("typescript", { ...baseOptions, monorepo: "turbo" })).toBe("apps/foo");
  });

  it("returns empty string for Rust without workspace and not polyglot", () => {
    expect(getSubPath("rust", { ...baseOptions, languages: ["rust"] })).toBe("");
  });

  it("returns crates/<name> for Rust with workspace", () => {
    expect(getSubPath("rust", { ...baseOptions, languages: ["rust"], rustWorkspace: true })).toBe(
      "crates/foo",
    );
  });

  it("returns crates/<name> for Rust in polyglot", () => {
    expect(
      getSubPath("rust", {
        ...baseOptions,
        languages: ["typescript", "rust"],
        monorepo: "turbo",
      }),
    ).toBe("crates/foo");
  });

  it("returns empty string for Python without workspace and not polyglot", () => {
    expect(getSubPath("python", { ...baseOptions, languages: ["python"] })).toBe("");
  });

  it("returns packages/<name> for Python with workspace", () => {
    expect(
      getSubPath("python", { ...baseOptions, languages: ["python"], pythonWorkspace: true }),
    ).toBe("packages/foo");
  });

  it("returns py/<name> for Python in polyglot", () => {
    expect(
      getSubPath("python", {
        ...baseOptions,
        languages: ["typescript", "python"],
        monorepo: "turbo",
      }),
    ).toBe("py/foo");
  });
});
