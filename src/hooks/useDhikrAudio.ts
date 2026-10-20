import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import logger from '@/utils/logger';

const POSITION_UPDATE_INTERVAL_MS = 250;

export interface DhikrAudioState {
    isPlaying: boolean;
    isLoading: boolean;
    failed: boolean;
    /** Seconds */
    position: number;
    duration: number;
}

const IDLE: DhikrAudioState = { isPlaying: false, isLoading: false, failed: false, position: 0, duration: 0 };

/**
 * Plays one recording, loaded on the first play. `onPosition` gets the position in seconds while it plays,
 * and `onFinish` when it plays to the end.
 */
export const useDhikrAudio = (
    url: string | null,
    rate: number,
    onPosition: (seconds: number) => void,
    onFinish: () => void,
) => {
    const [state, setState] = useState<DhikrAudioState>(IDLE);
    const soundRef = useRef<Audio.Sound | null>(null);
    const loadingRef = useRef<Promise<Audio.Sound | null> | null>(null);
    const callbacksRef = useRef({ onPosition, onFinish });
    callbacksRef.current = { onPosition, onFinish };
    const rateRef = useRef(rate);
    rateRef.current = rate;

    useEffect(() => {
        setState(IDLE);
        return () => {
            const loading = loadingRef.current;
            soundRef.current = null;
            loadingRef.current = null;
            loading?.then(sound => sound?.unloadAsync()).catch(() => { });
        };
    }, [url]);

    useEffect(() => {
        soundRef.current?.setRateAsync(rate, true).catch(() => { });
    }, [rate]);

    const handleStatus = useCallback((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        const position = status.positionMillis / 1000;
        setState(prev => ({
            ...prev,
            isPlaying: status.isPlaying,
            isLoading: false,
            position,
            duration: (status.durationMillis ?? 0) / 1000,
        }));
        if (status.isPlaying) callbacksRef.current.onPosition(position);
        if (status.didJustFinish) callbacksRef.current.onFinish();
    }, []);

    const load = useCallback(() => {
        if (!url) return Promise.resolve(null);
        if (!loadingRef.current) {
            setState(prev => ({ ...prev, isLoading: true, failed: false }));
            loadingRef.current = Audio.Sound.createAsync(
                { uri: url },
                { progressUpdateIntervalMillis: POSITION_UPDATE_INTERVAL_MS, rate: rateRef.current, shouldCorrectPitch: true },
                handleStatus,
            )
                .then(({ sound }) => (soundRef.current = sound))
                .catch(error => {
                    logger.error('Dhikr audio failed to load', error);
                    loadingRef.current = null;
                    setState(prev => ({ ...prev, isLoading: false, failed: true }));
                    return null;
                });
        }
        return loadingRef.current;
    }, [url, handleStatus]);

    /** Starts playing, from `fromSeconds` when given. */
    const play = useCallback(async (fromSeconds?: number) => {
        const sound = await load();
        if (!sound) return;
        if (fromSeconds !== undefined) await sound.setPositionAsync(fromSeconds * 1000);
        await sound.playAsync();
    }, [load]);

    const pause = useCallback(async () => {
        await soundRef.current?.pauseAsync();
    }, []);

    /** Moves to `seconds` if the recording is loaded; it keeps playing or stays paused. */
    const seek = useCallback(async (seconds: number) => {
        await soundRef.current?.setPositionAsync(seconds * 1000);
    }, []);

    return { state, play, pause, seek };
};
