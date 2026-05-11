import * as clack from "@clack/prompts";
import type { Options, PartialOptions } from "../options.js";
import { OptionsSchema } from "../options.js";
import { which } from "../util/exec.js";
import {
  applyDefaults,
  askBunTest,
  askCi,
  askDescription,
  askGithub,
  askLanguages,
  askMonorepo,
  askName,
  askPackageManager,
} from "./questions.js";

export type RunPromptsOptions = {
  nonInteractive: boolean;
  yes: boolean;
};

export const runPrompts = async (
  partial: PartialOptions,
  { nonInteractive, yes }: RunPromptsOptions,
): Promise<Options> => {
  if (nonInteractive || yes) {
    const filled = applyDefaults(partial);
    const result = OptionsSchema.safeParse(filled);
    if (!result.success) {
      const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Cannot run non-interactively — missing required fields: ${missing}`);
    }
    return result.data;
  }

  clack.intro("create-workspace");

  const name = await askName(partial.name);
  const description = await askDescription(partial.description);
  const languages = await askLanguages(partial.languages);
  const monorepo = await askMonorepo(partial.monorepo, languages);
  const packageManager = await askPackageManager(partial.packageManager, languages);
  const bunTest = await askBunTest(partial.bunTest, packageManager, languages);
  const ci = await askCi(partial.ci);
  const ghAvailable = await which("gh");
  const github = await askGithub(partial.github, ghAvailable);

  const filled = applyDefaults({
    ...partial,
    name,
    description,
    languages,
    monorepo,
    packageManager,
    bunTest,
    ci,
    github,
  });

  const result = OptionsSchema.parse(filled);
  clack.outro("Got it — scaffolding…");
  return result;
};
