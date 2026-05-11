import { z } from "zod";

const NPM_NAME_RE = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const MAX_NAME_LEN = 214;

const NameSchema = z
  .string()
  .min(1, "Name is required")
  .max(MAX_NAME_LEN, `Name must be ≤${MAX_NAME_LEN} characters`)
  .regex(
    NPM_NAME_RE,
    "Name must be a valid npm package name (lowercase, no spaces, no leading . or _)",
  );

export const validateName = (value: string) => NameSchema.safeParse(value);

export const LanguageSchema = z.enum(["typescript", "rust", "python"]);
export type Language = z.infer<typeof LanguageSchema>;

export const PackageManagerSchema = z.enum(["pnpm", "bun"]);
export type PackageManager = z.infer<typeof PackageManagerSchema>;

export const BunTestSchema = z.enum(["vitest", "bun", "both"]);
export type BunTest = z.infer<typeof BunTestSchema>;

export const MonorepoSchema = z.enum(["turbo", "nx", "none"]);
export type Monorepo = z.infer<typeof MonorepoSchema>;

export const GithubVisibilitySchema = z.enum(["public", "private", "internal"]);
export type GithubVisibility = z.infer<typeof GithubVisibilitySchema>;

export const OptionsSchema = z.object({
  name: NameSchema,
  description: z.string().default(""),
  cwd: z.string(),
  languages: z.array(LanguageSchema).min(1, "At least one language is required"),
  packageManager: PackageManagerSchema,
  bunTest: BunTestSchema,
  monorepo: MonorepoSchema,
  rustWorkspace: z.boolean(),
  pythonWorkspace: z.boolean(),
  ci: z.boolean(),
  github: z.boolean(),
  githubVisibility: GithubVisibilitySchema,
  githubOwner: z.string().optional(),
  git: z.boolean(),
  commit: z.boolean(),
  install: z.boolean(),
  verbose: z.boolean(),
});

export type Options = z.infer<typeof OptionsSchema>;
export type PartialOptions = Partial<Options> & Pick<Options, "cwd">;
