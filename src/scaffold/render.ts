import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Eta } from 'eta';

import type { Options } from '../options.js';
import type { FilePlan } from '../plan/contributors.js';

export type RenderContext = {
  name: string;
  description: string;
  author: { name: string; email: string };
  year: number;
  options: Options;
};

export type RenderFileOptions = {
  author?: { name: string; email: string };
  templatesRoot: string;
};

const eta = new Eta({ autoEscape: false, useWith: false });

export const buildRenderContext = (
  opts: Options,
  author: { name: string; email: string },
): RenderContext => ({
  author,
  description: opts.description,
  name: opts.name,
  options: opts,
  year: new Date().getFullYear(),
});

export const renderFile = async (
  plan: FilePlan,
  opts: Options,
  renderOpts: RenderFileOptions,
): Promise<string> => {
  const { templatesRoot } = renderOpts;
  const author = renderOpts.author ?? { email: '', name: '' };

  if (plan.compose) {
    const parts: string[] = [];
    for (const fragment of plan.compose.fragments) {
      const fragPath = join(templatesRoot, 'fragments', fragment);
      try {
        // eslint-disable-next-line no-await-in-loop
        parts.push(await readFile(fragPath, 'utf8'));
      } catch {
        // Missing fragment: skip silently. Matches the prior shared-contributor behavior.
      }
    }
    return parts.join('\n');
  }

  if (plan.content !== undefined) {
    return plan.content;
  }
  if (!plan.template) {
    throw new Error(`FilePlan for ${plan.target} has neither template, content, nor compose`);
  }

  const fullPath = join(templatesRoot, plan.template);
  const source = await readFile(fullPath, 'utf8');

  if (plan.raw || !plan.template.endsWith('.tmpl')) {
    return source;
  }

  const ctx = buildRenderContext(opts, author);
  const rendered = eta.renderString(source, ctx);
  return rendered;
};
