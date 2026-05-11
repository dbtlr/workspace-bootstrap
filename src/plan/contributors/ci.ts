import type { Options } from '../../options.js';
import type { Contribution, FilePlan } from '../contributors.js';

const templateFor = (languages: Options['languages']): string => {
  if (languages.length > 1) {
    return 'ci/polyglot.yml.tmpl';
  }
  const [lang] = languages;
  if (lang === 'rust') {
    return 'ci/rust.yml.tmpl';
  }
  if (lang === 'python') {
    return 'ci/python.yml.tmpl';
  }
  return 'ci/ts.yml.tmpl';
};

const ciContributor = (opts: Options): Contribution => {
  if (!opts.ci) {
    return { deps: {}, files: [], postSteps: [] };
  }

  const files: FilePlan[] = [
    {
      target: '.github/workflows/ci.yml',
      template: templateFor(opts.languages),
    },
  ];

  return {
    deps: {},
    files,
    postSteps: [],
  };
};

export default ciContributor;
