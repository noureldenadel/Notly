/**
 * Performance utilities for optimization
 */

/**
 * Debounce a function - delays execution until after wait ms have elapsed since last call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function debounced(...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, wait);
    };
}

/**
 * Throttle a function - ensures function is called at most once per wait ms
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    wait: number
): (...args: Parameters<T>) => void {
    let lastTime = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function throttled(...args: Parameters<T>) {
        const now = Date.now();
        const remaining = wait - (now - lastTime);

        if (remaining <= 0 || remaining > wait) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            lastTime = now;
            fn(...args);
        } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastTime = Date.now();
                timeoutId = null;
                fn(...args);
            }, remaining);
        }
    };
}

/**
 * Measure performance of a function
 */
export function measurePerformance<T extends (...args: unknown[]) => unknown>(
    name: string,
    fn: T
): T {
    return ((...args: Parameters<T>) => {
        const start = performance.now();
        const result = fn(...args);
        const end = performance.now();
        console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }) as T;
}

/**
 * Async version of measurePerformance
 */
export function measurePerformanceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
    name: string,
    fn: T
): T {
    return (async (...args: Parameters<T>) => {
        const start = performance.now();
        const result = await fn(...args);
        const end = performance.now();
        console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }) as T;
}

/**
 * Request animation frame throttle - ensures function runs at most once per frame
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
    fn: T
): (...args: Parameters<T>) => void {
    let rafId: number | null = null;
    let lastArgs: Parameters<T> | null = null;

    return function throttled(...args: Parameters<T>) {
        lastArgs = args;

        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                rafId = null;
                if (lastArgs) {
                    fn(...lastArgs);
                }
            });
        }
    };
}

/**
 * Check if a rectangle is visible within the viewport
 */
export function isRectInViewport(
    rect: { x: number; y: number; width: number; height: number },
    viewport: { x: number; y: number; width: number; height: number; zoom: number },
    padding = 100
): boolean {
    const scaledPadding = padding / viewport.zoom;

    const viewLeft = viewport.x - scaledPadding;
    const viewRight = viewport.x + viewport.width / viewport.zoom + scaledPadding;
    const viewTop = viewport.y - scaledPadding;
    const viewBottom = viewport.y + viewport.height / viewport.zoom + scaledPadding;

    return !(
        rect.x + rect.width < viewLeft ||
        rect.x > viewRight ||
        rect.y + rect.height < viewTop ||
        rect.y > viewBottom
    );
}

/**
 * Batch multiple updates into a single render
 */
export function batchUpdates<T>(updates: (() => T)[]): T[] {
    // React 18 automatically batches updates, but this helps with explicit batching
    return updates.map(update => update());
}

/**
 * Create a lazy initializer that caches the result
 */
export function lazy<T>(factory: () => T): () => T {
    let cached: T | undefined;
    let initialized = false;

    return () => {
        if (!initialized) {
            cached = factory();
            initialized = true;
        }
        return cached as T;
    };
}

/**
 * Memoize a function with a simple cache
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
        const key = keyFn(...args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args) as ReturnType<T>;
        cache.set(key, result);
        return result;
    }) as T;
}

/**
 * Clear memoization cache (for cache invalidation)
 */
export function createMemoizedFn<T extends (...args: unknown[]) => unknown>(
    fn: T,
    keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): { fn: T; clearCache: () => void } {
    const cache = new Map<string, ReturnType<T>>();

    const memoized = ((...args: Parameters<T>) => {
        const key = keyFn(...args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args) as ReturnType<T>;
        cache.set(key, result);
        return result;
    }) as T;

    return {
        fn: memoized,
        clearCache: () => cache.clear(),
    };
}
