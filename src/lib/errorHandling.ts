/**
 * Error handling utilities for the application
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
    id: string;
    type: 'network' | 'storage' | 'runtime' | 'validation' | 'unknown';
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    originalError?: Error;
    timestamp: number;
    context?: Record<string, unknown>;
    recoverable: boolean;
}

/**
 * Create a standardized app error
 */
export function createAppError(
    type: AppError['type'],
    message: string,
    options: {
        severity?: ErrorSeverity;
        userMessage?: string;
        originalError?: Error;
        context?: Record<string, unknown>;
        recoverable?: boolean;
    } = {}
): AppError {
    const {
        severity = 'error',
        userMessage = getDefaultUserMessage(type),
        originalError,
        context,
        recoverable = true,
    } = options;

    return {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type,
        severity,
        message,
        userMessage,
        originalError,
        timestamp: Date.now(),
        context,
        recoverable,
    };
}

/**
 * Get user-friendly message for error type
 */
function getDefaultUserMessage(type: AppError['type']): string {
    switch (type) {
        case 'network':
            return 'Connection issue. Please check your internet and try again.';
        case 'storage':
            return 'Failed to save your data. Please check available storage.';
        case 'runtime':
            return 'Something went wrong. Please try again or reload the app.';
        case 'validation':
            return 'Invalid input. Please check your data and try again.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

/**
 * Classify an error based on its characteristics
 */
export function classifyError(error: unknown): AppError['type'] {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return 'network';
    }

    if (error instanceof DOMException) {
        if (error.name === 'QuotaExceededError') {
            return 'storage';
        }
        if (error.name === 'NotFoundError') {
            return 'storage';
        }
    }

    if (error instanceof SyntaxError) {
        return 'validation';
    }

    if (error instanceof ReferenceError || error instanceof TypeError) {
        return 'runtime';
    }

    return 'unknown';
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandlers(
    onError: (error: AppError) => void
): () => void {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        event.preventDefault();
        console.error('[Global] Unhandled rejection:', event.reason);

        const appError = createAppError(
            classifyError(event.reason),
            event.reason?.message || 'Unhandled promise rejection',
            {
                severity: 'error',
                originalError: event.reason instanceof Error ? event.reason : undefined,
                context: { type: 'unhandledrejection' },
            }
        );

        onError(appError);
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
        event.preventDefault();
        console.error('[Global] Uncaught error:', event.error);

        const appError = createAppError(
            classifyError(event.error),
            event.error?.message || event.message,
            {
                severity: 'critical',
                originalError: event.error,
                context: {
                    type: 'error',
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                },
            }
        );

        onError(appError);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Return cleanup function
    return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
    };
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    options: {
        onError?: (error: AppError) => void;
        fallback?: ReturnType<T>;
        retries?: number;
        retryDelay?: number;
    } = {}
): T {
    const { onError, fallback, retries = 0, retryDelay = 1000 } = options;

    return (async (...args: Parameters<T>): Promise<unknown> => {
        let lastError: unknown;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn(...args);
            } catch (error) {
                lastError = error;
                console.error(`[ErrorHandling] Attempt ${attempt + 1}/${retries + 1} failed:`, error);

                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
                }
            }
        }

        const appError = createAppError(
            classifyError(lastError),
            lastError instanceof Error ? lastError.message : 'Unknown error',
            {
                originalError: lastError instanceof Error ? lastError : undefined,
                context: { retries },
            }
        );

        onError?.(appError);

        if (fallback !== undefined) {
            return fallback;
        }

        throw lastError;
    }) as T;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
    json: string,
    fallback: T
): T {
    try {
        return JSON.parse(json) as T;
    } catch (error) {
        console.warn('[ErrorHandling] JSON parse failed:', error);
        return fallback;
    }
}

/**
 * Safe storage operations
 */
export const safeStorage = {
    getItem(key: string, fallback: string | null = null): string | null {
        try {
            return localStorage.getItem(key) ?? fallback;
        } catch (error) {
            console.warn('[ErrorHandling] localStorage.getItem failed:', error);
            return fallback;
        }
    },

    setItem(key: string, value: string): boolean {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error('[ErrorHandling] localStorage.setItem failed:', error);
            return false;
        }
    },

    removeItem(key: string): boolean {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('[ErrorHandling] localStorage.removeItem failed:', error);
            return false;
        }
    },
};

/**
 * Log error for debugging (could be extended to send to error tracking service)
 */
export function logError(error: AppError): void {
    const logLevel = error.severity === 'critical' || error.severity === 'error'
        ? 'error'
        : error.severity === 'warning'
            ? 'warn'
            : 'info';

    console[logLevel]('[App Error]', {
        id: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        timestamp: new Date(error.timestamp).toISOString(),
        context: error.context,
    });

    if (error.originalError) {
        console[logLevel]('[Original Error]', error.originalError);
    }
}
