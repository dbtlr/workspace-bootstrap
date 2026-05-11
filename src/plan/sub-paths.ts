import type { Language, Options } from '../options.js';

export const isPolyglot = (opts: Options): boolean => opts.languages.length > 1;

export const getSubPath = (lang: Language, opts: Options): string => {
  const polyglot = isPolyglot(opts);

  if (lang === 'typescript') {
    if (opts.monorepo === 'none') return '';
    return `apps/${opts.name}`;
  }

  if (lang === 'rust') {
    if (polyglot) return `crates/${opts.name}`;
    if (opts.rustWorkspace) return `crates/${opts.name}`;
    return '';
  }

  if (lang === 'python') {
    if (polyglot) return `py/${opts.name}`;
    if (opts.pythonWorkspace) return `packages/${opts.name}`;
    return '';
  }

  return '';
};
