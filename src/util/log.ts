import { consola } from 'consola';

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
    debug: (msg) => log.debug(msg),
    error: (msg) => log.error(msg),
    info: (msg) => log.info(msg),
    success: (msg) => log.success(msg),
    warn: (msg) => log.warn(msg),
  };
};
