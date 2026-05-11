#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';

import { VERSION } from './index.js';
import type { Language, PartialOptions } from './options.js';
import { run } from './run.js';

const main = defineCommand({
  meta: {
    name: 'create-workspace',
    version: VERSION,
    description: 'Scaffold a new workspace with modern TS/Rust/Python tooling.',
  },
  args: {
    name: {
      type: 'positional',
      required: false,
      description: 'Project name (also accepted via --name)',
    },
    description: { type: 'string', description: 'Short project description' },
    cwd: { type: 'string', alias: 'C', description: 'Working directory (default: cwd)' },
    language: {
      type: 'string',
      description: 'Language(s): typescript, rust, python (repeatable, comma-separated also OK)',
    },
    monorepo: { type: 'string', description: 'turbo | nx | none' },
    'package-manager': { type: 'string', description: 'pnpm | bun (TS only)' },
    'bun-test': { type: 'string', description: 'vitest | bun | both (TS+bun only)' },
    'rust-workspace': { type: 'boolean', description: 'Use a Cargo workspace' },
    'no-rust-workspace': { type: 'boolean' },
    'python-workspace': { type: 'boolean', description: 'Use a uv workspace' },
    'no-python-workspace': { type: 'boolean' },
    ci: { type: 'boolean', description: 'Add GitHub Actions CI' },
    'no-ci': { type: 'boolean' },
    github: { type: 'boolean', description: 'Create a GitHub repo via gh' },
    'no-github': { type: 'boolean' },
    'github-visibility': { type: 'string', description: 'public | private | internal' },
    'github-owner': { type: 'string', description: 'GitHub owner (org or user)' },
    git: { type: 'boolean', description: 'Run git init (default: true)' },
    'no-git': { type: 'boolean' },
    commit: { type: 'boolean', description: 'Create initial commit (default: true)' },
    'no-commit': { type: 'boolean' },
    install: { type: 'boolean', description: 'Install deps after scaffold (default: true)' },
    'no-install': { type: 'boolean' },
    yes: { type: 'boolean', alias: 'y', description: 'Accept all defaults, skip prompts' },
    'non-interactive': { type: 'boolean', description: 'Fail if any required field is missing' },
    verbose: { type: 'boolean', description: 'Verbose logging' },
  },
  async run({ args }) {
    const flagsAsPartial = parseFlags(args);
    await run(flagsAsPartial, {
      nonInteractive: Boolean(args['non-interactive']),
      yes: Boolean(args.yes),
    });
  },
});

const parseLanguages = (value: string | string[] | undefined): Language[] | undefined => {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value : [value];
  const flat = raw.flatMap((v) => v.split(','));
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
  if (enable === true) return true;
  if (disable === true) return false;
  return defaultValue;
};

const parseFlags = (args: Record<string, unknown>): PartialOptions => {
  const partial: PartialOptions = {
    cwd: (typeof args.cwd === 'string' && args.cwd) || process.cwd(),
  };
  if (typeof args.name === 'string' && args.name.length > 0) partial.name = args.name;
  if (typeof args.description === 'string') partial.description = args.description;
  const languages = parseLanguages(args.language as string | string[] | undefined);
  if (languages) partial.languages = languages;
  if (args.monorepo === 'turbo' || args.monorepo === 'nx' || args.monorepo === 'none') {
    partial.monorepo = args.monorepo;
  }
  if (args['package-manager'] === 'pnpm' || args['package-manager'] === 'bun') {
    partial.packageManager = args['package-manager'];
  }
  if (args['bun-test'] === 'vitest' || args['bun-test'] === 'bun' || args['bun-test'] === 'both') {
    partial.bunTest = args['bun-test'];
  }
  const rw = boolFromPair(args['rust-workspace'], args['no-rust-workspace'], undefined);
  if (rw !== undefined) partial.rustWorkspace = rw;
  const pw = boolFromPair(args['python-workspace'], args['no-python-workspace'], undefined);
  if (pw !== undefined) partial.pythonWorkspace = pw;
  const ci = boolFromPair(args.ci, args['no-ci'], undefined);
  if (ci !== undefined) partial.ci = ci;
  const gh = boolFromPair(args.github, args['no-github'], undefined);
  if (gh !== undefined) partial.github = gh;
  if (
    args['github-visibility'] === 'public' ||
    args['github-visibility'] === 'private' ||
    args['github-visibility'] === 'internal'
  ) {
    partial.githubVisibility = args['github-visibility'];
  }
  if (typeof args['github-owner'] === 'string') partial.githubOwner = args['github-owner'];
  const git = boolFromPair(args.git, args['no-git'], undefined);
  if (git !== undefined) partial.git = git;
  const commit = boolFromPair(args.commit, args['no-commit'], undefined);
  if (commit !== undefined) partial.commit = commit;
  const install = boolFromPair(args.install, args['no-install'], undefined);
  if (install !== undefined) partial.install = install;
  if (args.verbose === true) partial.verbose = true;
  return partial;
};

void runMain(main);
