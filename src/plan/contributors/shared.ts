import type { Language, Options } from '../../options.js';
import type { Contribution, FilePlan } from '../contributors.js';

const fragmentForLanguage = (lang: Language): string =>
  `gitignore.${lang === 'typescript' ? 'ts' : lang}`;

const gitignoreFragments = (languages: Language[]): string[] => [
  'gitignore.shared',
  ...languages.map(fragmentForLanguage),
];

export const sharedContributor = (opts: Options): Contribution => {
  const files: FilePlan[] = [
    { template: 'shared/README.md.tmpl', target: 'README.md' },
    { template: 'shared/AGENTS.md.tmpl', target: 'AGENTS.md' },
    { template: 'shared/.editorconfig', target: '.editorconfig' },
    { template: 'shared/mise.toml.tmpl', target: 'mise.toml' },
    {
      target: '.gitignore',
      compose: { fragments: gitignoreFragments(opts.languages) },
      raw: true,
    },
    { target: 'CLAUDE.md', content: '@AGENTS.md\n', raw: true },
  ];

  return {
    files,
    postSteps: [],
    deps: {},
  };
};
