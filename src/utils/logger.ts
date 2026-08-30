// Simple logger utility to reduce noisy logs in production
// debug/info logs print only in development; warn/error always pass through

const isDev = (() => {
    try {
        // __DEV__ is available in React Native/Expo
        if (typeof __DEV__ !== 'undefined') return (__DEV__ as unknown) as boolean;
    } catch (_) {
        // ignore
    }
    // Fallback to NODE_ENV for web
    return typeof process !== 'undefined' && (process as any)?.env?.NODE_ENV !== 'production';
})();

type LogFn = (...args: any[]) => void;

const noop: LogFn = () => { };

export const logger = {
    debug: isDev ? ((...args: any[]) => console.log(...args)) : noop,
    info: isDev ? ((...args: any[]) => console.info(...args)) : noop,
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
};

export default logger;
