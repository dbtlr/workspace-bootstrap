import { mkdir, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { Options } from '../options.js';
import type { Plan } from '../plan/contributors.js';
import templatesDir from '../util/paths.js';
import { renderFile } from './render.js';

export type ExecutePlanOptions = {
  targetDir: string;
  templatesRoot?: string;
  author?: { name: string; email: string };
};

export const executePlan = async (
  plan: Plan,
  opts: Options,
  execOpts: ExecutePlanOptions,
): Promise<void> => {
  const { targetDir } = execOpts;
  const renderOpts = {
    author: execOpts.author ?? { email: '', name: '' },
    templatesRoot: execOpts.templatesRoot ?? templatesDir(),
  };

  // eslint-disable-next-line no-await-in-loop
  await mkdir(targetDir, { recursive: true });

  for (const file of plan.files) {
    const fullTarget = join(targetDir, file.target);
    // eslint-disable-next-line no-await-in-loop
    await mkdir(dirname(fullTarget), { recursive: true });

    let symlinkCreated = false;
    if (file.target === 'CLAUDE.md' && file.content === '@AGENTS.md\n') {
      try {
        // eslint-disable-next-line no-await-in-loop
        await symlink('AGENTS.md', fullTarget);
        symlinkCreated = true;
      } catch {
        // Fall through to writeFile with the @AGENTS.md import-syntax content.
      }
    }

    if (!symlinkCreated) {
      // eslint-disable-next-line no-await-in-loop
      const content = await renderFile(file, opts, renderOpts);
      // eslint-disable-next-line no-await-in-loop
      await writeFile(fullTarget, content, 'utf8');
    }
  }
};
