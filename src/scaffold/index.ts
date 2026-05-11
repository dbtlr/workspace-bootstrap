import { mkdir, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Options } from "../options.js";
import type { Plan } from "../plan/contributors.js";
import { templatesDir } from "../util/paths.js";
import { renderFile } from "./render.js";

export type ExecutePlanOptions = {
  templatesRoot?: string;
  author?: { name: string; email: string };
};

export const executePlan = async (
  plan: Plan,
  targetDir: string,
  opts: Options,
  execOpts: ExecutePlanOptions = {},
): Promise<void> => {
  const templatesRoot = execOpts.templatesRoot ?? templatesDir();
  const author = execOpts.author ?? { name: "", email: "" };

  await mkdir(targetDir, { recursive: true });

  for (const file of plan.files) {
    const fullTarget = join(targetDir, file.target);
    await mkdir(dirname(fullTarget), { recursive: true });

    if (file.target === "CLAUDE.md" && file.content === "@AGENTS.md\n") {
      try {
        await symlink("AGENTS.md", fullTarget);
        continue;
      } catch {
        // Fall through to writeFile with the @AGENTS.md import-syntax content.
      }
    }

    const content = await renderFile(file, opts, templatesRoot, author);
    await writeFile(fullTarget, content, "utf8");
  }
};
