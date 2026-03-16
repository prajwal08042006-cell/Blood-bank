/**
 * Logger utility — only logs in development mode.
 * In production builds, all log calls are no-ops to prevent
 * information leakage and keep the console clean.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (isDev) console.error(...args);
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },
};
