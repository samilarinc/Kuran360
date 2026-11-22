import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '@/utils/logger';
import {
    AudioPlayer, PlayerStatus, loadPlayer, onStatus, releasePlayer, showOnLockScreen,
} from '@/services/audioPlayer';

const POSITION_UPDATE_INTERVAL_MS = 250;
const LOAD_TIMEOUT_MS = 15000;

export interface DhikrAudioState {
    isPlaying: boolean;
    isLoading: boolean;
    failed: boolean;
    /** Seconds */
    position: number;
    duration: number;
}

/** Shows the recording in the media notification / lock screen while it plays */
export interface DhikrLockScreen {
    title: string;
    artist?: string;
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
    lockScreen?: DhikrLockScreen,
) => {
    const [state, setState] = useState<DhikrAudioState>(IDLE);
    const soundRef = useRef<AudioPlayer | null>(null);
    const loadingRef = useRef<Promise<AudioPlayer | null> | null>(null);
    const callbacksRef = useRef({ onPosition, onFinish });
    callbacksRef.current = { onPosition, onFinish };
    const rateRef = useRef(rate);
    rateRef.current = rate;
    const lockScreenRef = useRef(lockScreen);
    lockScreenRef.current = lockScreen;

    useEffect(() => {
        setState(IDLE);
        return () => {
            const loading = loadingRef.current;
            soundRef.current = null;
            loadingRef.current = null;
            loading?.then(sound => {
                try { sound?.clearLockScreenControls(); } catch { }
                releasePlayer(sound);
            }).catch(() => { });
        };
    }, [url]);

    useEffect(() => {
        try { soundRef.current?.setPlaybackRate(rate); } catch { }
    }, [rate]);

    // Android reports the end more than once; report it once per play-through
    const finishedRef = useRef(false);

    const handleStatus = useCallback((status: PlayerStatus) => {
        if (status.error) {
            logger.error('Dhikr audio failed', status.error);
            setState(prev => ({ ...prev, isPlaying: false, isLoading: false, failed: true }));
            return;
        }
        if (!status.isLoaded) return;
        const position = status.currentTime;
        setState(prev => ({
            ...prev,
            isPlaying: status.playing,
            isLoading: false,
            position,
            duration: status.duration,
        }));
        if (status.playing) callbacksRef.current.onPosition(position);
        if (status.didJustFinish && !finishedRef.current) {
            finishedRef.current = true;
            callbacksRef.current.onFinish();
        }
    }, []);

    const load = useCallback(() => {
        if (!url) return Promise.resolve(null);
        if (!loadingRef.current) {
            setState(prev => ({ ...prev, isLoading: true, failed: false }));
            loadingRef.current = loadPlayer(url, {
                timeoutMs: LOAD_TIMEOUT_MS,
                updateIntervalMs: POSITION_UPDATE_INTERVAL_MS,
                rate: rateRef.current,
            })
                .then(sound => {
                    onStatus(sound, handleStatus);
                    soundRef.current = sound;
                    return sound;
                })
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
        if (fromSeconds !== undefined) await sound.seekTo(fromSeconds);
        finishedRef.current = false;
        sound.play();
        const info = lockScreenRef.current;
        if (info) showOnLockScreen(sound, info.title, info.artist);
    }, [load]);

    const pause = useCallback(async () => {
        soundRef.current?.pause();
    }, []);

    /** Moves to `seconds` if the recording is loaded; it keeps playing or stays paused. */
    const seek = useCallback(async (seconds: number) => {
        finishedRef.current = false;
        await soundRef.current?.seekTo(seconds);
    }, []);

    return { state, play, pause, seek };
};
