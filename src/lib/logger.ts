/**
 * Logger utility for consistent debug/error logging across the application.
 * In development mode, all logs are shown.
 * In production, only warnings and errors are logged.
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    prefix?: string;
}

function formatArgs(prefix: string, args: unknown[]): unknown[] {
    return [`[${prefix}]`, ...args];
}

/**
 * Creates a prefixed logger instance for a specific module/component.
 * @param prefix - Module or component name prefix for log messages
 */
export function createLogger(prefix: string) {
    return {
        debug: (...args: unknown[]) => {
            if (isDev) {
                console.log(...formatArgs(prefix, args));
            }
        },
        info: (...args: unknown[]) => {
            console.info(...formatArgs(prefix, args));
        },
        warn: (...args: unknown[]) => {
            console.warn(...formatArgs(prefix, args));
        },
        error: (...args: unknown[]) => {
            console.error(...formatArgs(prefix, args));
        },
    };
}

/**
 * Global logger instance for general use.
 * Prefer createLogger() for component-specific logging.
 */
export const logger = {
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.log('[DEBUG]', ...args);
        }
    },
    info: (...args: unknown[]) => {
        console.info('[INFO]', ...args);
    },
    warn: (...args: unknown[]) => {
        console.warn('[WARN]', ...args);
    },
    error: (...args: unknown[]) => {
        console.error('[ERROR]', ...args);
    },
};
