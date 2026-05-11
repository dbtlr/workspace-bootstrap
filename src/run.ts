import type { PartialOptions } from "./options.js";
import type { RunPromptsOptions } from "./prompts/index.js";

export const run = async (
  _partial: PartialOptions,
  _promptOpts: RunPromptsOptions,
): Promise<void> => {
  throw new Error("run.ts is a stub — will be implemented in Task 11.");
};
