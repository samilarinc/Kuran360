import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const UPDATE_INTERVAL_MS = 50;
// Total acceleration (in g, gravity included) above which a sample counts as a jolt
const JOLT_THRESHOLD_G = 2.0;
// One swing spans several samples above the threshold; count it once
const MIN_JOLT_GAP_MS = 120;
// Only sustained, vigorous shaking fires: this many jolts within the window (~1.5-2 s of shaking).
// Walking, running or dropping the phone into a pocket stay well below it.
const WINDOW_MS = 2000;
const REQUIRED_JOLTS = 8;
const COOLDOWN_MS = 3000;

/**
 * Calls `onShake` when the device is shaken hard for a couple of seconds.
 * Native only; listens only while `enabled` and the app is in the foreground.
 */
export const useShakeDetector = (onShake: () => void, enabled: boolean) => {
    const onShakeRef = useRef(onShake);
    onShakeRef.current = onShake;

    useEffect(() => {
        if (Platform.OS === 'web' || !enabled) return;

        let subscription: { remove: () => void } | null = null;
        let cancelled = false;
        let jolts: number[] = [];
        let lastJolt = 0;
        let lastFired = 0;

        const start = async () => {
            if (subscription) return;
            try {
                if (!(await Accelerometer.isAvailableAsync()) || cancelled || subscription) return;
            } catch {
                return;
            }
            Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
            subscription = Accelerometer.addListener(({ x, y, z }) => {
                const now = Date.now();
                if (Math.sqrt(x * x + y * y + z * z) < JOLT_THRESHOLD_G || now - lastJolt < MIN_JOLT_GAP_MS) return;
                lastJolt = now;
                jolts = jolts.filter(t => now - t < WINDOW_MS);
                jolts.push(now);
                if (jolts.length >= REQUIRED_JOLTS && now - lastFired > COOLDOWN_MS) {
                    lastFired = now;
                    jolts = [];
                    onShakeRef.current();
                }
            });
        };

        const stop = () => {
            subscription?.remove();
            subscription = null;
            jolts = [];
        };

        if (AppState.currentState === 'active') start();
        const appStateSub = AppState.addEventListener('change', state => {
            if (state === 'active') start();
            else stop();
        });

        return () => {
            cancelled = true;
            appStateSub.remove();
            stop();
        };
    }, [enabled]);
};
