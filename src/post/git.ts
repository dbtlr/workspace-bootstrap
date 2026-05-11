import type { Options } from '../options.js';
import { exec } from '../util/exec.js';
import type { Logger } from '../util/log.js';

export const runGit = async (targetDir: string, opts: Options, log: Logger): Promise<void> => {
  log.info('Initializing git repo…');
  const init = await exec('git', ['init', '-q'], { cwd: targetDir });
  if (init.code !== 0) {
    log.error(`git init failed: ${init.stderr}`);
    return;
  }

  if (!opts.commit) {
    log.debug('Skipping initial commit (commit: false)');
    return;
  }

  const add = await exec('git', ['add', '.'], { cwd: targetDir });
  if (add.code !== 0) {
    log.error(`git add failed: ${add.stderr}`);
    return;
  }

  const commit = await exec('git', ['commit', '-q', '-m', 'chore: initial commit'], {
    cwd: targetDir,
  });
  if (commit.code !== 0) {
    log.error(`git commit failed: ${commit.stderr}`);
    return;
  }
  log.success('Initial commit created.');
};
