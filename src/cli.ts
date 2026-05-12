#!/usr/bin/env node
import { readFileSync } from 'node:fs';

import { defineCommand, runMain } from 'citty';

import type { Language, PartialOptions } from './options.js';
import run from './run.js';

function getPackageVersion(): string {
  try {
    // Attempt to read version from package.json
    const pkgPath = new URL('../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (typeof pkg.version === 'string') {
      return pkg.version;
    }
  } catch {
    // If any error occurs (e.g., file not found), fall back to default version
  }

  return '0.0.0';
}

const main = defineCommand({
  args: {
    'bun-test': { description: 'vitest | bun | both (TS+bun only)', type: 'string' },
    ci: { description: 'Add GitHub Actions CI', type: 'boolean' },
    commit: { description: 'Create initial commit (default: true)', type: 'boolean' },
    cwd: { alias: 'C', description: 'Working directory (default: cwd)', type: 'string' },
    description: { description: 'Short project description', type: 'string' },
    git: { description: 'Run git init (default: true)', type: 'boolean' },
    github: { description: 'Create a GitHub repo via gh', type: 'boolean' },
    'github-owner': { description: 'GitHub owner (org or user)', type: 'string' },
    'github-visibility': { description: 'public | private | internal', type: 'string' },
    install: { description: 'Install deps after scaffold (default: true)', type: 'boolean' },
    language: {
      description: 'Language(s): typescript, rust, python (repeatable, comma-separated also OK)',
      type: 'string',
    },
    monorepo: { description: 'turbo | nx | none', type: 'string' },
    name: {
      description: 'Project name (also accepted via --name)',
      required: false,
      type: 'positional',
    },
    'no-ci': { type: 'boolean' },
    'no-commit': { type: 'boolean' },
    'no-git': { type: 'boolean' },
    'no-github': { type: 'boolean' },
    'no-install': { type: 'boolean' },
    'no-python-workspace': { type: 'boolean' },
    'no-rust-workspace': { type: 'boolean' },
    'non-interactive': { description: 'Fail if any required field is missing', type: 'boolean' },
    'package-manager': { description: 'pnpm | bun (TS only)', type: 'string' },
    'python-workspace': { description: 'Use a uv workspace', type: 'boolean' },
    'rust-workspace': { description: 'Use a Cargo workspace', type: 'boolean' },
    verbose: { description: 'Verbose logging', type: 'boolean' },
    yes: { alias: 'y', description: 'Accept all defaults, skip prompts', type: 'boolean' },
  },
  meta: {
    description: 'Scaffold a new workspace with modern TS/Rust/Python tooling.',
    name: 'create-workspace',
    version: getPackageVersion(),
  },
  async run({ args }) {
    const flagsAsPartial = parseFlags(args);
    await run(flagsAsPartial, {
      nonInteractive: args['non-interactive'],
      yes: args.yes,
    });
  },
});

const parseLanguages = (value: string | string[] | undefined): Language[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const raw = Array.isArray(value) ? value : [value];
  const flat = raw.flatMap((val) => val.split(','));
  const valid: Language[] = [];
  for (const item of flat) {
    const trimmed = item.trim();
    if (trimmed === 'typescript' || trimmed === 'rust' || trimmed === 'python') {
      valid.push(trimmed);
    } else if (trimmed !== '') {
      throw new Error(`Unknown language: ${trimmed}`);
    }
  }
  return valid.length > 0 ? valid : undefined;
};

const boolFromPair = (
  enable: unknown,
  disable: unknown,
  defaultValue: boolean | undefined,
): boolean | undefined => {
  // Citty auto-negates `--no-X` to `args.X = false`, so check that form first.
  if (enable === true) {
    return true;
  }
  if (enable === false) {
    return false;
  }
  if (disable === true) {
    return false;
  }
  return defaultValue;
};

const parseRawLanguage = (rawLang: unknown): string | string[] | undefined => {
  if (typeof rawLang === 'string') {
    return rawLang;
  }
  if (Array.isArray(rawLang)) {
    return rawLang.filter((item): item is string => typeof item === 'string');
  }
  return undefined;
};

const applyWorkspaceFlags = (partial: PartialOptions, args: Record<string, unknown>): void => {
  const rw = boolFromPair(args['rust-workspace'], args['no-rust-workspace'], undefined);
  if (rw !== undefined) {
    partial.rustWorkspace = rw;
  }
  const pw = boolFromPair(args['python-workspace'], args['no-python-workspace'], undefined);
  if (pw !== undefined) {
    partial.pythonWorkspace = pw;
  }
};

const applyLifecycleFlags = (partial: PartialOptions, args: Record<string, unknown>): void => {
  const ci = boolFromPair(args.ci, args['no-ci'], undefined);
  if (ci !== undefined) {
    partial.ci = ci;
  }
  const gh = boolFromPair(args.github, args['no-github'], undefined);
  if (gh !== undefined) {
    partial.github = gh;
  }
  const git = boolFromPair(args.git, args['no-git'], undefined);
  if (git !== undefined) {
    partial.git = git;
  }
  const commit = boolFromPair(args.commit, args['no-commit'], undefined);
  if (commit !== undefined) {
    partial.commit = commit;
  }
  const install = boolFromPair(args.install, args['no-install'], undefined);
  if (install !== undefined) {
    partial.install = install;
  }
};

const applyEnumFlags = (partial: PartialOptions, args: Record<string, unknown>): void => {
  if (args.monorepo === 'turbo' || args.monorepo === 'nx' || args.monorepo === 'none') {
    partial.monorepo = args.monorepo;
  }
  if (args['package-manager'] === 'pnpm' || args['package-manager'] === 'bun') {
    partial.packageManager = args['package-manager'];
  }
  if (args['bun-test'] === 'vitest' || args['bun-test'] === 'bun' || args['bun-test'] === 'both') {
    partial.bunTest = args['bun-test'];
  }
  if (
    args['github-visibility'] === 'public' ||
    args['github-visibility'] === 'private' ||
    args['github-visibility'] === 'internal'
  ) {
    partial.githubVisibility = args['github-visibility'];
  }
  if (typeof args['github-owner'] === 'string') {
    partial.githubOwner = args['github-owner'];
  }
};

const parseFlags = (args: Record<string, unknown>): PartialOptions => {
  const partial: PartialOptions = {
    cwd: (typeof args.cwd === 'string' && args.cwd) || process.cwd(),
  };
  if (typeof args.name === 'string' && args.name.length > 0) {
    partial.name = args.name;
  }
  if (typeof args.description === 'string') {
    partial.description = args.description;
  }
  const languages = parseLanguages(parseRawLanguage(args.language));
  if (languages) {
    partial.languages = languages;
  }
  applyEnumFlags(partial, args);
  applyWorkspaceFlags(partial, args);
  applyLifecycleFlags(partial, args);
  if (args.verbose === true) {
    partial.verbose = true;
  }
  return partial;
};

void runMain(main);
