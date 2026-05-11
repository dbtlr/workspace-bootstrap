import type { Options } from '../options.js';

export type FilePlan = {
  /** Path to template file under `templates/`, e.g. `'shared/README.md.tmpl'`. */
  template?: string;
  /** Raw content to write — used by programmatic generators instead of `template`. */
  content?: string;
  /**
   * Compose the output by concatenating fragments from `templates/fragments/`.
   * Fragment file names are paths relative to that directory. Missing fragments
   * are silently skipped. Fragments are joined with `\n`. Always treated as raw.
   */
  compose?: { fragments: string[] };
  /** Output path relative to the target dir, e.g. `'README.md'`. */
  target: string;
  /** If true, content should be treated as already-final (skip eta). Defaults based on file ext. */
  raw?: boolean;
};

export type PostStep = {
  kind: 'git-init' | 'git-commit' | 'install' | 'hooks';
  args?: Record<string, string | boolean>;
};

export type PkgDeps = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export type CrateDeps = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type PyDeps = {
  dependencies?: string[];
  devDependencies?: string[];
};

export type Contribution = {
  files: FilePlan[];
  postSteps: PostStep[];
  deps: {
    ts?: PkgDeps;
    rust?: CrateDeps;
    python?: PyDeps;
  };
};

export type Contributor = (opts: Options) => Contribution;

export type Plan = {
  files: FilePlan[];
  postSteps: PostStep[];
  deps: {
    ts?: PkgDeps;
    rust?: CrateDeps;
    python?: PyDeps;
  };
};
