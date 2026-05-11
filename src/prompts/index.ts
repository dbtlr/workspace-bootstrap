import { intro, outro } from '@clack/prompts';

import type { Options, PartialOptions } from '../options.js';
import { OptionsSchema } from '../options.js';
import { which } from '../util/exec.js';
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
} from './questions.js';

export type RunPromptsOptions = {
  nonInteractive: boolean;
  yes: boolean;
};

const runNonInteractive = (partial: PartialOptions): Options => {
  const filled = applyDefaults(partial);
  const result = OptionsSchema.safeParse(filled);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Cannot run non-interactively — missing required fields: ${missing}`);
  }
  return result.data;
};

const gatherAnswers = async (partial: PartialOptions): Promise<PartialOptions> => {
  const name = await askName(partial.name);
  const description = await askDescription(partial.description);
  const languages = await askLanguages(partial.languages);
  const monorepo = await askMonorepo(partial.monorepo, languages);
  const packageManager = await askPackageManager(partial.packageManager, languages);
  const bunTest = await askBunTest(partial.bunTest, packageManager, languages);
  const ci = await askCi(partial.ci);
  const ghAvailable = await which('gh');
  const github = await askGithub(partial.github, ghAvailable);
  return {
    ...partial,
    bunTest,
    ci,
    description,
    github,
    languages,
    monorepo,
    name,
    packageManager,
  };
};

export const runPrompts = async (
  partial: PartialOptions,
  { nonInteractive, yes }: RunPromptsOptions,
): Promise<Options> => {
  if (nonInteractive || yes) {
    return runNonInteractive(partial);
  }

  intro('create-workspace');
  const answers = await gatherAnswers(partial);
  const filled = applyDefaults(answers);
  const result = OptionsSchema.parse(filled);
  outro('Got it — scaffolding…');
  return result;
};
