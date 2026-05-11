import * as clack from "@clack/prompts";
import type { Options, PartialOptions } from "../options.js";
import { validateName } from "../options.js";

export const applyDefaults = (partial: PartialOptions): PartialOptions => {
  const isPolyglot = (partial.languages?.length ?? 0) > 1;
  return {
    description: "",
    monorepo: isPolyglot ? "turbo" : "none",
    packageManager: "pnpm",
    bunTest: "vitest",
    rustWorkspace: false,
    pythonWorkspace: false,
    ci: false,
    github: false,
    githubVisibility: "private",
    git: true,
    commit: true,
    install: true,
    verbose: false,
    ...partial,
  };
};

const cancelIfNeeded = <T>(value: T | symbol): T => {
  if (clack.isCancel(value)) {
    clack.cancel("Bootstrap cancelled.");
    process.exit(130);
  }
  return value;
};

export const askName = async (current: string | undefined): Promise<string> => {
  if (current !== undefined) return current;
  const value = await clack.text({
    message: "Project name?",
    placeholder: "my-project",
    validate: (input: string | undefined) => {
      if (input === undefined) return undefined;
      const result = validateName(input);
      return result.success ? undefined : result.error.issues[0]?.message;
    },
  });
  return cancelIfNeeded(value);
};

export const askDescription = async (current: string | undefined): Promise<string> => {
  if (current !== undefined) return current;
  const value = await clack.text({
    message: "Short description? (optional)",
    placeholder: "",
    defaultValue: "",
  });
  return cancelIfNeeded(value);
};

export const askLanguages = async (
  current: Options["languages"] | undefined,
): Promise<Options["languages"]> => {
  if (current !== undefined) return current;
  const value = await clack.multiselect({
    message: "Which languages?",
    options: [
      { value: "typescript", label: "TypeScript" },
      { value: "rust", label: "Rust" },
      { value: "python", label: "Python" },
    ],
    required: true,
  });
  return cancelIfNeeded(value) as Options["languages"];
};

export const askMonorepo = async (
  current: Options["monorepo"] | undefined,
  languages: Options["languages"],
): Promise<Options["monorepo"]> => {
  if (current !== undefined) return current;
  if (!languages.includes("typescript") && languages.length === 1) return "none";
  const isPolyglot = languages.length > 1;
  const value = await clack.select({
    message: isPolyglot ? "Polyglot monorepo tool?" : "Use a monorepo?",
    options: [
      { value: "turbo", label: "Turborepo" },
      { value: "nx", label: "Nx" },
      ...(isPolyglot ? [] : [{ value: "none", label: "No, single-package" }]),
    ],
    initialValue: isPolyglot ? "turbo" : "none",
  });
  return cancelIfNeeded(value) as Options["monorepo"];
};

export const askPackageManager = async (
  current: Options["packageManager"] | undefined,
  languages: Options["languages"],
): Promise<Options["packageManager"]> => {
  if (current !== undefined) return current;
  if (!languages.includes("typescript")) return "pnpm";
  const value = await clack.select({
    message: "Package manager?",
    options: [
      { value: "pnpm", label: "pnpm" },
      { value: "bun", label: "bun" },
    ],
    initialValue: "pnpm",
  });
  return cancelIfNeeded(value) as Options["packageManager"];
};

export const askBunTest = async (
  current: Options["bunTest"] | undefined,
  packageManager: Options["packageManager"],
  languages: Options["languages"],
): Promise<Options["bunTest"]> => {
  if (current !== undefined) return current;
  if (!languages.includes("typescript") || packageManager !== "bun") return "vitest";
  const value = await clack.select({
    message: "Test runner?",
    options: [
      { value: "vitest", label: "vitest (via Vite+)" },
      { value: "bun", label: "bun:test" },
      { value: "both", label: "both" },
    ],
    initialValue: "vitest",
  });
  return cancelIfNeeded(value) as Options["bunTest"];
};

export const askCi = async (current: boolean | undefined): Promise<boolean> => {
  if (current !== undefined) return current;
  const value = await clack.confirm({
    message: "Add GitHub Actions CI?",
    initialValue: false,
  });
  return cancelIfNeeded(value);
};

export const askGithub = async (
  current: boolean | undefined,
  ghAvailable: boolean,
): Promise<boolean> => {
  if (current !== undefined) return current;
  if (!ghAvailable) return false;
  const value = await clack.confirm({
    message: "Create a GitHub repo via `gh`?",
    initialValue: false,
  });
  return cancelIfNeeded(value);
};
