import type { Language, Options } from '../../options.js';
import type { Contribution, FilePlan } from '../contributors.js';

const fragmentForLanguage = (lang: Language): string =>
  `gitignore.${lang === 'typescript' ? 'ts' : lang}`;

const gitignoreFragments = (languages: Language[]): string[] => [
  'gitignore.shared',
  ...languages.map(fragmentForLanguage),
];

const sharedContributor = (opts: Options): Contribution => {
  const files: FilePlan[] = [
    { target: 'README.md', template: 'shared/README.md.tmpl' },
    { target: 'AGENTS.md', template: 'shared/AGENTS.md.tmpl' },
    { target: '.editorconfig', template: 'shared/.editorconfig' },
    { target: 'mise.toml', template: 'shared/mise.toml.tmpl' },
    {
      compose: { fragments: gitignoreFragments(opts.languages) },
      raw: true,
      target: '.gitignore',
    },
    { content: '@AGENTS.md\n', raw: true, target: 'CLAUDE.md' },
  ];

  return {
    deps: {},
    files,
    postSteps: [],
  };
};

export default sharedContributor;
