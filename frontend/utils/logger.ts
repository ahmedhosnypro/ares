/**
 * 📝 Logger Utility
 * Works in both Client and Server components.
 * - Errors are always logged (even in production).
 * - Logs and Warnings are only shown in development.
 */

const isProd = process.env.NODE_ENV === "production";

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (!isProd) {
      globalThis.console.log(`[INFO]: ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (!isProd) {
      globalThis.console.warn(`[WARN]: ${message}`, ...args);
    }
  },
  error: (message: string, error?: unknown, ...args: unknown[]) => {
    // Errors are always logged to help with production debugging
    globalThis.console.error(`[ERROR]: ${message}`, error, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (!isProd) {
      globalThis.console.debug(`[DEBUG]: ${message}`, ...args);
    }
  },
};
