import { useEffect, useState } from 'react';
import { Verse } from '@/types';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getWordSegments } from '@/utils/arabicText';
import { getActiveWordIndex, getVerseWordStarts } from '@/services/wordTimings';

export interface ActiveWord {
    /** Index in getWordSegments order. */
    index: number;
    /** Audio time already spent in this word when it became active (negative: it starts shortly). */
    elapsedMs: number;
    /** How long the word is recited, in audio time. */
    durationMs: number;
    /** False while paused, so the highlight can freeze instead of disappearing. */
    isPlaying: boolean;
}

// The last word has no following word to end at
const FALLBACK_LAST_WORD_MS = 1500;
const EXTRAPOLATE_INTERVAL_MS = 40;

/**
 * The word being recited while this verse plays (or is paused), else null.
 * Also null for reciters without word timings, so callers simply don't highlight anything.
 */
export const useActiveWord = (verse: Verse): ActiveWord | null => {
    const { audioState, subscribeToPosition } = useGlobalAudio();
    const { settings } = useSettings();
    const isCurrent = audioState.currentVerse?.id === verse.id && settings.wordTrackingEnabled;
    const [starts, setStarts] = useState<number[] | null>(null);
    const [active, setActive] = useState<Omit<ActiveWord, 'isPlaying'> | null>(null);

    // Timings load only once this verse plays (and once per reciter: the file is cached)
    useEffect(() => {
        if (!isCurrent) return;
        let cancelled = false;
        getVerseWordStarts(settings.selectedReciter, verse.surahNumber, verse.number).then(result => {
            // Timings were built for one word split; if the verse data has since changed, highlight nothing
            if (!cancelled) setStarts(result?.length === getWordSegments(verse).length ? result : null);
        });
        return () => { cancelled = true; };
    }, [isCurrent, settings.selectedReciter, verse]);

    const audioDuration = audioState.duration;
    const isPlaying = audioState.isPlaying;
    const playbackRate = settings.playbackRate;
    useEffect(() => {
        if (!isCurrent || !starts) {
            setActive(null);
            return;
        }
        // Only re-renders when the word changes, not on every tick
        const moveTo = (positionMillis: number) => {
            const index = getActiveWordIndex(starts, positionMillis);
            setActive(prev => {
                if (prev?.index === index) return prev;
                const end = index + 1 < starts.length ? starts[index + 1] : audioDuration || starts[index] + FALLBACK_LAST_WORD_MS;
                return { index, elapsedMs: positionMillis - starts[index], durationMs: Math.max(end - starts[index], 1) };
            });
        };

        // The player reports its position only every 100-250 ms (web ignores the interval), which would make
        // the highlight lag behind the voice; between reports the position is extrapolated from the clock.
        let lastTick: { position: number; at: number } | null = null;
        const unsubscribe = subscribeToPosition((verseId, positionMillis) => {
            if (verseId !== verse.id) return;
            lastTick = { position: positionMillis, at: Date.now() };
            moveTo(positionMillis);
        });
        const timer = isPlaying
            ? setInterval(() => {
                if (lastTick) moveTo(lastTick.position + (Date.now() - lastTick.at) * playbackRate);
            }, EXTRAPOLATE_INTERVAL_MS)
            : null;
        return () => {
            unsubscribe();
            if (timer) clearInterval(timer);
        };
    }, [isCurrent, isPlaying, starts, subscribeToPosition, verse.id, audioDuration, playbackRate]);

    return isCurrent && active ? { ...active, isPlaying: audioState.isPlaying } : null;
};
