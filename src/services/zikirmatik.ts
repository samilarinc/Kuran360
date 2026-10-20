import AsyncStorage from '@react-native-async-storage/async-storage';
import { DHIKR_PRESETS, DhikrPreset, DhikrStep } from '@/data/dhikrPresets';
import type { DhikrAudio } from '@/data/dhikrAudio';

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
    /** Playback speed of the recordings. */
    audioRate: number;
    /** Which script steps written in both are shown in. */
    textMode: DhikrTextMode;
}

export type DhikrTextMode = 'arabic' | 'transliteration';

export const EMPTY_PROGRESS: DhikrProgress = { step: 0, count: 0, done: false };

export const EMPTY_STATE: ZikirmatikState = { activeId: null, custom: [], progress: {}, targets: {}, audioRate: 1, textMode: 'transliteration' };

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

/** Takes back the last tap on the current step. */
export const undo = (preset: DhikrPreset, progress: DhikrProgress): DhikrProgress => {
    if (progress.done) {
        const last = preset.steps[progress.step];
        return { step: progress.step, count: last?.count ? last.count - 1 : 0, done: false };
    }
    return progress.count > 0 ? { ...progress, count: progress.count - 1 } : progress;
};

/** Clears the current step's count, or goes back to the very start when it's already clear. */
export const reset = (progress: DhikrProgress): DhikrProgress =>
    progress.count > 0 && !progress.done ? { ...progress, count: 0 } : EMPTY_PROGRESS;

/** Goes back to the start of the previous step. */
export const previous = (progress: DhikrProgress): DhikrProgress =>
    ({ step: Math.max(0, progress.step - 1), count: 0, done: false });

/** Keeps a count within what the target allows, after the target was changed. */
export const clampProgress = (preset: DhikrPreset, progress: DhikrProgress): DhikrProgress => {
    const target = preset.steps[progress.step]?.count;
    if (!target || progress.count < target) return progress;
    return { ...progress, count: target, done: progress.step === preset.steps.length - 1 };
};

/** Where a recording is at a given second, as progress through its preset (its first step until that starts). */
export const progressAtTime = (preset: DhikrPreset, audio: DhikrAudio, seconds: number): DhikrProgress => {
    let current = { ...EMPTY_PROGRESS, step: Math.max(0, preset.steps.findIndex(s => audio.timeline[s.id])) };
    preset.steps.forEach((step, index) => {
        const timing = audio.timeline[step.id];
        if (!timing || timing.start > seconds) return;
        const said = timing.counts?.filter(time => time <= seconds).length ?? 0;
        current = { step: index, count: Math.min(said, step.count ?? 0), done: false };
    });
    return current;
};

/**
 * The second a recording reaches the given progress. A step it doesn't recite maps to the next one it does;
 * null when there is none after it.
 */
export const timeAtProgress = (preset: DhikrPreset, audio: DhikrAudio, progress: DhikrProgress): number | null => {
    const step = preset.steps[progress.step];
    const timing = step && audio.timeline[step.id];
    if (!timing) {
        const later = preset.steps.slice(progress.step + 1).find(s => audio.timeline[s.id]);
        return later ? audio.timeline[later.id].start : null;
    }
    return timing.counts?.[progress.count - 1] ?? timing.start;
};
