import { existsSync, statSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { exec as nodeExec } from "./util/exec.js";
import { createLogger } from "./util/log.js";
import type { Options, PartialOptions } from "./options.js";
import { runPrompts, type RunPromptsOptions } from "./prompts/index.js";
import { buildPlan } from "./plan/index.js";
import { sharedContributor } from "./plan/contributors/shared.js";
import { monorepoContributor } from "./plan/contributors/monorepo.js";
import { tsContributor } from "./plan/contributors/languages/ts.js";
import { rustContributor } from "./plan/contributors/languages/rust.js";
import { pythonContributor } from "./plan/contributors/languages/python.js";
import { executePlan } from "./scaffold/index.js";
import { runGit } from "./post/git.js";
import { runInstall } from "./post/install.js";

const detectAuthor = async (cwd: string): Promise<{ name: string; email: string }> => {
  const nameResult = await nodeExec("git", ["config", "user.name"], { cwd });
  const emailResult = await nodeExec("git", ["config", "user.email"], { cwd });
  return {
    name: nameResult.stdout.trim(),
    email: emailResult.stdout.trim(),
  };
};

const validateCwdAndTarget = (cwd: string, name: string): string => {
  const absCwd = isAbsolute(cwd) ? cwd : resolve(process.cwd(), cwd);
  if (!existsSync(absCwd) || !statSync(absCwd).isDirectory()) {
    throw new Error(`cwd does not exist or is not a directory: ${absCwd}`);
  }
  const target = join(absCwd, name);
  if (existsSync(target)) {
    throw new Error(`Target directory already exists: ${target}`);
  }
  return target;
};

export const run = async (
  partial: PartialOptions,
  promptOpts: RunPromptsOptions,
): Promise<void> => {
  const log = createLogger(Boolean(partial.verbose));

  const isTty = process.stdin.isTTY === true;
  const effective: RunPromptsOptions = {
    nonInteractive: promptOpts.nonInteractive || !isTty,
    yes: promptOpts.yes,
  };

  const opts: Options = await runPrompts(partial, effective);
  const targetDir = validateCwdAndTarget(opts.cwd, opts.name);

  const author = await detectAuthor(opts.cwd);

  const plan = buildPlan(opts, [
    sharedContributor,
    monorepoContributor,
    tsContributor,
    rustContributor,
    pythonContributor,
  ]);

  log.info(`Scaffolding ${opts.name} → ${targetDir}`);
  await executePlan(plan, targetDir, opts, { author });
  log.success(`Wrote ${plan.files.length} files.`);

  if (opts.git) {
    await runGit(targetDir, opts, log);
  }
  if (opts.install) {
    await runInstall(targetDir, opts, log);
  }

  log.success(`Done. cd ${opts.name}`);
};
