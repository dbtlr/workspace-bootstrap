import type { Options } from '../options.js';
import { isPolyglot } from '../plan/sub-paths.js';
import { exec, which } from '../util/exec.js';
import type { Logger } from '../util/log.js';

export type InstallCommand = { tool: string; args: string[] };

export const installCommandsFor = (opts: Options): InstallCommand[] => {
  const cmds: InstallCommand[] = [];

  if (opts.languages.includes('typescript')) {
    const pm = opts.packageManager;
    cmds.push({ tool: pm, args: ['install'] });
    const usingVitePlus = !(pm === 'bun' && opts.bunTest === 'bun');
    if (usingVitePlus) {
      cmds.push({ tool: pm, args: ['exec', 'vp', 'config'] });
    }
  }

  if (opts.languages.includes('rust')) {
    const hasRootCargoToml = opts.rustWorkspace || !isPolyglot(opts);
    if (hasRootCargoToml) {
      cmds.push({ tool: 'cargo', args: ['fetch'] });
    }
  }

  if (opts.languages.includes('python')) {
    cmds.push({ tool: 'uv', args: ['sync'] });
  }

  return cmds;
};

export const runInstall = async (targetDir: string, opts: Options, log: Logger): Promise<void> => {
  const cmds = installCommandsFor(opts);
  if (cmds.length === 0) {
    log.debug('No install commands for selected languages.');
    return;
  }

  for (const { tool, args } of cmds) {
    if (!(await which(tool))) {
      log.warn(
        `${tool} not found on PATH — skipping \`${tool} ${args.join(' ')}\`. Run it manually.`,
      );
      continue;
    }
    log.info(`Running ${tool} ${args.join(' ')}…`);
    const result = await exec(tool, args, { cwd: targetDir, inherit: true });
    if (result.code !== 0) {
      log.error(`${tool} ${args.join(' ')} failed (exit ${result.code}).`);
      return;
    }
  }
};
