import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Language, Options } from "../../options.js";
import { templatesDir } from "../../util/paths.js";
import type { Contribution, FilePlan } from "../contributors.js";

const readFragment = (name: string): string => {
  const path = join(templatesDir(), "fragments", name);
  return readFileSync(path, "utf8");
};

const buildGitignore = (languages: Language[]): string => {
  const parts = [readFragment("gitignore.shared")];
  for (const lang of languages) {
    try {
      parts.push(readFragment(`gitignore.${lang === "typescript" ? "ts" : lang}`));
    } catch {
      // Per-language fragment may not exist yet (added in language contributor tasks).
    }
  }
  return parts.join("\n");
};

export const sharedContributor = (opts: Options): Contribution => {
  const files: FilePlan[] = [
    { template: "shared/README.md.tmpl", target: "README.md" },
    { template: "shared/AGENTS.md.tmpl", target: "AGENTS.md" },
    { template: "shared/.editorconfig", target: ".editorconfig" },
    { template: "shared/mise.toml.tmpl", target: "mise.toml" },
    { target: ".gitignore", content: buildGitignore(opts.languages), raw: true },
    { target: "CLAUDE.md", content: "@AGENTS.md\n", raw: true },
  ];

  return {
    files,
    postSteps: [],
    deps: {},
  };
};
