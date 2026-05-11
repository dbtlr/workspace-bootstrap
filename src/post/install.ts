import type { Options } from "../options.js";
import { exec, which } from "../util/exec.js";
import type { Logger } from "../util/log.js";

export const runInstall = async (targetDir: string, opts: Options, log: Logger): Promise<void> => {
  if (!opts.languages.includes("typescript")) {
    log.debug("No TS in languages — skipping TS install step.");
    return;
  }

  const pm = opts.packageManager;
  if (!(await which(pm))) {
    log.warn(`${pm} not found on PATH — skipping install. Run \`${pm} install\` manually.`);
    return;
  }

  log.info(`Running ${pm} install…`);
  const install = await exec(pm, ["install"], { cwd: targetDir, inherit: true });
  if (install.code !== 0) {
    log.error(`${pm} install failed (exit ${install.code}).`);
    return;
  }

  const usingVitePlus = !(pm === "bun" && opts.bunTest === "bun");
  if (usingVitePlus) {
    log.info("Installing Vite+ commit hooks…");
    const hooks = await exec(pm === "pnpm" ? "pnpm" : "bun", ["exec", "vp", "config"], {
      cwd: targetDir,
      inherit: true,
    });
    if (hooks.code !== 0) {
      log.warn(`vp config exited ${hooks.code} — hooks may not be installed.`);
    }
  }
};
