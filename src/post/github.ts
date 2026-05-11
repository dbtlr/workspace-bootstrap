import type { Options } from '../options.js';
import { exec, which } from '../util/exec.js';
import type { Logger } from '../util/log.js';

export type GithubCommand = { tool: string; args: string[] };

export const githubCommandsFor = (opts: Options, hasOriginRemote: boolean): GithubCommand[] => {
  if (!opts.github || hasOriginRemote) {
    return [];
  }

  const repo = opts.githubOwner ? `${opts.githubOwner}/${opts.name}` : opts.name;
  const args: string[] = [
    'repo',
    'create',
    repo,
    `--${opts.githubVisibility}`,
    '--source=.',
    '--remote=origin',
  ];

  if (opts.commit) {
    args.push('--push');
  }

  if (opts.description !== '') {
    args.push('--description', opts.description);
  }

  return [{ args, tool: 'gh' }];
};

const getOriginRemote = async (targetDir: string): Promise<string | null> => {
  const result = await exec('git', ['remote', 'get-url', 'origin'], { cwd: targetDir });
  return result.code === 0 ? result.stdout.trim() : null;
};

const runGithub = async (targetDir: string, opts: Options, log: Logger): Promise<void> => {
  if (!opts.github) {
    log.debug('GitHub integration disabled.');
    return;
  }

  if (!(await which('gh'))) {
    log.warn('gh not found on PATH — skipping GitHub setup. Install gh or run manually.');
    return;
  }

  const existingRemote = await getOriginRemote(targetDir);
  if (existingRemote !== null) {
    log.info(`origin remote already configured: ${existingRemote}`);
    return;
  }

  const cmds = githubCommandsFor(opts, false);
  for (const { tool, args } of cmds) {
    log.info(`Running ${tool} ${args.join(' ')}…`);
    // eslint-disable-next-line no-await-in-loop
    const result = await exec(tool, args, { cwd: targetDir, inherit: true });
    if (result.code !== 0) {
      log.error(
        `${tool} ${args.slice(0, 3).join(' ')} failed (exit ${result.code}). Continuing without GitHub setup.`,
      );
      return;
    }
  }
  log.success('GitHub repo created and pushed.');
};

export default runGithub;
