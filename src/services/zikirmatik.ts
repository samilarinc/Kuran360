import AsyncStorage from '@react-native-async-storage/async-storage';
import { DHIKR_PRESETS, DhikrPreset, DhikrStep } from '@/data/dhikrPresets';

const STORAGE_KEY = 'zikirmatik.v1';

export const CUSTOM_PREFIX = 'custom:';
export const MAX_TARGET = 99999;

const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

export interface CustomDhikr {
    id: string;
    text: string;
    target: number;
}

/** Where the user is in a preset: which step, and how many times they've said it. */
export interface DhikrProgress {
    step: number;
    count: number;
    done: boolean;
}

export interface ZikirmatikState {
    activeId: string | null;
    custom: CustomDhikr[];
    progress: Record<string, DhikrProgress>;
    /** Targets the user changed on adjustable presets, by preset id. */
    targets: Record<string, number>;
}

export const EMPTY_PROGRESS: DhikrProgress = { step: 0, count: 0, done: false };

export const EMPTY_STATE: ZikirmatikState = { activeId: null, custom: [], progress: {}, targets: {} };

export const loadState = async (): Promise<ZikirmatikState> => {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : EMPTY_STATE;
    } catch {
        return EMPTY_STATE;
    }
};

export const saveState = (state: ZikirmatikState) =>
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => { });

/** The preset for an id: a built-in one, or a custom dhikr dressed as a single-step preset. */
export const resolvePreset = (id: string, state: ZikirmatikState): DhikrPreset | null => {
    const builtIn = DHIKR_PRESETS.find(p => p.id === id);
    if (builtIn) {
        const target = state.targets[id];
        return builtIn.adjustableTarget && target
            ? { ...builtIn, steps: [{ ...builtIn.steps[0], count: target }] }
            : builtIn;
    }
    const custom = state.custom.find(c => CUSTOM_PREFIX + c.id === id);
    if (!custom) return null;
    const target = state.targets[id] ?? custom.target;
    return {
        id,
        adjustableTarget: true,
        steps: [{
            id,
            ...(ARABIC_SCRIPT.test(custom.text) ? { arabic: custom.text } : { transliteration: custom.text }),
            count: target,
        }],
    };
};

/** Fraction of a preset done, 0..1, counting each step by its own target (read-only steps count as one). */
export const getProgressFraction = (preset: DhikrPreset, progress: DhikrProgress): number => {
    if (progress.done) return 1;
    const weight = (s: DhikrStep) => s.count ?? 1;
    const total = preset.steps.reduce((sum, s) => sum + weight(s), 0);
    const before = preset.steps.slice(0, progress.step).reduce((sum, s) => sum + weight(s), 0);
    return total > 0 ? Math.min(1, (before + progress.count) / total) : 0;
};

/** Progress after one tap on a counted step, moving to the next step (or finishing) when the target is reached. */
export const tap = (preset: DhikrPreset, progress: DhikrProgress): { progress: DhikrProgress; reachedTarget: boolean } => {
    const target = preset.steps[progress.step]?.count ?? 0;
    if (progress.done || target === 0) return { progress, reachedTarget: false };
    const count = progress.count + 1;
    if (count < target) return { progress: { ...progress, count }, reachedTarget: false };
    return { progress: advance(preset, progress), reachedTarget: true };
};

/** Moves past the current step. */
export const advance = (preset: DhikrPreset, progress: DhikrProgress): DhikrProgress =>
    progress.step + 1 < preset.steps.length
        ? { step: progress.step + 1, count: 0, done: false }
        : { step: progress.step, count: preset.steps[progress.step]?.count ?? 0, done: true };

/** Takes back the last tap, or the last move to a new step. */
export const undo = (preset: DhikrPreset, progress: DhikrProgress): DhikrProgress => {
    if (progress.done) {
        const last = preset.steps[progress.step];
        return { step: progress.step, count: last?.count ? last.count - 1 : 0, done: false };
    }
    if (progress.count > 0) return { ...progress, count: progress.count - 1 };
    if (progress.step === 0) return progress;
    const previous = preset.steps[progress.step - 1];
    return { step: progress.step - 1, count: previous.count ? previous.count - 1 : 0, done: false };
};

/** Keeps a count within what the target allows, after the target was changed. */
export const clampProgress = (preset: DhikrPreset, progress: DhikrProgress): DhikrProgress => {
    const target = preset.steps[progress.step]?.count;
    if (!target || progress.count < target) return progress;
    return { ...progress, count: target, done: progress.step === preset.steps.length - 1 };
};
