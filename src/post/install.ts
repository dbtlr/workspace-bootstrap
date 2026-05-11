import type { Options } from '../options.js';
import { isPolyglot } from '../plan/sub-paths.js';
import { exec, which } from '../util/exec.js';
import type { Logger } from '../util/log.js';

export type InstallCommand = { tool: string; args: string[] };

export const installCommandsFor = (opts: Options): InstallCommand[] => {
  const cmds: InstallCommand[] = [];

  if (opts.languages.includes('typescript')) {
    const pm = opts.packageManager;
    cmds.push({ args: ['install'], tool: pm });
    const usingVitePlus = !(pm === 'bun' && opts.bunTest === 'bun');
    if (usingVitePlus) {
      cmds.push({ args: ['exec', 'vp', 'config'], tool: pm });
    }
  }

  if (opts.languages.includes('rust')) {
    const hasRootCargoToml = opts.rustWorkspace || !isPolyglot(opts);
    if (hasRootCargoToml) {
      cmds.push({ args: ['fetch'], tool: 'cargo' });
    }
  }

  if (opts.languages.includes('python')) {
    cmds.push({ args: ['sync'], tool: 'uv' });
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
    // eslint-disable-next-line no-await-in-loop
    const toolFound = await which(tool);
    if (!toolFound) {
      log.warn(
        `${tool} not found on PATH — skipping \`${tool} ${args.join(' ')}\`. Run it manually.`,
      );
    } else {
      log.info(`Running ${tool} ${args.join(' ')}…`);
      // eslint-disable-next-line no-await-in-loop
      const installResult = await exec(tool, args, { cwd: targetDir, inherit: true });
      if (installResult.code !== 0) {
        log.error(`${tool} ${args.join(' ')} failed (exit ${installResult.code}).`);
        return;
      }
    }
  }
};
