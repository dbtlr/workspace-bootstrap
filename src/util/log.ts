import { consola } from "consola";

export type Logger = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  success: (msg: string) => void;
  debug: (msg: string) => void;
};

export const createLogger = (verbose: boolean): Logger => {
  const log = consola.create({ level: verbose ? 4 : 3 });
  return {
    info: (msg) => log.info(msg),
    warn: (msg) => log.warn(msg),
    error: (msg) => log.error(msg),
    success: (msg) => log.success(msg),
    debug: (msg) => log.debug(msg),
  };
};
