/**
 * Keeps the last few console warnings/errors in memory so a bug report can carry them.
 * Installed once at startup (imported from App.tsx); the original console methods still run.
 */

const MAX_ENTRIES = 40;
const MAX_ENTRY_LENGTH = 400;

const entries: string[] = [];
let installed = false;

const stringify = (arg: unknown): string => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    try {
        return JSON.stringify(arg);
    } catch {
        return String(arg);
    }
};

const record = (level: string, args: unknown[]) => {
    const line = `${new Date().toISOString()} [${level}] ${args.map(stringify).join(' ')}`;
    entries.push(line.length > MAX_ENTRY_LENGTH ? line.slice(0, MAX_ENTRY_LENGTH) + '…' : line);
    if (entries.length > MAX_ENTRIES) entries.shift();
};

export const installLogBuffer = () => {
    if (installed) return;
    installed = true;
    (['warn', 'error'] as const).forEach(level => {
        const original = console[level];
        console[level] = (...args: unknown[]) => {
            try { record(level, args); } catch { }
            original.apply(console, args);
        };
    });
};

export const getRecentLogs = (): string => entries.join('\n');
