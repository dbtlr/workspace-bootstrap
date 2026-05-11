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

const eta = new Eta({ autoEscape: false, useWith: false });

export const buildRenderContext = (
  opts: Options,
  author: { name: string; email: string },
): RenderContext => ({
  name: opts.name,
  description: opts.description,
  author,
  year: new Date().getFullYear(),
  options: opts,
});

export const renderFile = async (
  plan: FilePlan,
  opts: Options,
  templatesRoot: string,
  author: { name: string; email: string } = { name: '', email: '' },
): Promise<string> => {
  if (plan.content !== undefined) {
    return plan.content;
  }
  if (!plan.template) {
    throw new Error(`FilePlan for ${plan.target} has neither template nor content`);
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
