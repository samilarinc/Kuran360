import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { normalizeDegrees, shortestAngleDelta } from '@/utils/qibla';

export type CompassStatus = 'idle' | 'starting' | 'active' | 'unsupported' | 'denied';

// Low-pass factor: lower is smoother but laggier. Sensors report ~60 times a second and jitter.
const SMOOTHING = 0.25;

/**
 * Device heading in degrees clockwise from north, or null until a reading arrives.
 * Native uses expo-location's heading (true north when a fix is known); web uses the
 * DeviceOrientation events (iOS Safari needs a user gesture, so call `start` from a press).
 */
export const useCompassHeading = () => {
    const [heading, setHeading] = useState<number | null>(null);
    const [status, setStatus] = useState<CompassStatus>('idle');
    const stopRef = useRef<(() => void) | null>(null);
    const smoothedRef = useRef<number | null>(null);

    const push = useCallback((raw: number) => {
        const previous = smoothedRef.current;
        const next = previous === null
            ? normalizeDegrees(raw)
            : normalizeDegrees(previous + shortestAngleDelta(previous, raw) * SMOOTHING);
        smoothedRef.current = next;
        setHeading(next);
    }, []);

    const stop = useCallback(() => {
        stopRef.current?.();
        stopRef.current = null;
    }, []);

    const startNative = useCallback(async () => {
        const subscription = await Location.watchHeadingAsync(({ trueHeading, magHeading }) =>
            push(trueHeading >= 0 ? trueHeading : magHeading),
        );
        stopRef.current = () => subscription.remove();
        setStatus('active');
    }, [push]);

    const startWeb = useCallback(async () => {
        const win = globalThis as any;
        const OrientationEvent = win.DeviceOrientationEvent;
        if (!OrientationEvent) {
            setStatus('unsupported');
            return;
        }

        if (typeof OrientationEvent.requestPermission === 'function') {
            const result = await OrientationEvent.requestPermission();
            if (result !== 'granted') {
                setStatus('denied');
                return;
            }
        }

        let received = false;
        const onOrientation = (event: any) => {
            // iOS Safari reports the compass heading directly. Elsewhere an absolute
            // alpha is the device's counter-clockwise rotation from north.
            let value: number | null = null;
            if (typeof event.webkitCompassHeading === 'number') {
                value = event.webkitCompassHeading;
            } else if (event.absolute && typeof event.alpha === 'number') {
                value = 360 - event.alpha;
            }
            if (value === null) return;
            if (!received) setStatus('active');
            received = true;
            push(value);
        };

        // Chrome on Android only reports an absolute alpha on the dedicated event.
        const eventName = 'ondeviceorientationabsolute' in win ? 'deviceorientationabsolute' : 'deviceorientation';
        win.addEventListener(eventName, onOrientation, true);
        // Desktop browsers expose the API but never fire it.
        const timeout = setTimeout(() => {
            if (!received) setStatus('unsupported');
        }, 2000);
        stopRef.current = () => {
            clearTimeout(timeout);
            win.removeEventListener(eventName, onOrientation, true);
        };
    }, [push]);

    const start = useCallback(async () => {
        stop();
        smoothedRef.current = null;
        setHeading(null);
        setStatus('starting');
        try {
            if (Platform.OS === 'web') {
                await startWeb();
            } else {
                await startNative();
            }
        } catch (error) {
            console.error('Error starting compass:', error);
            setStatus('unsupported');
        }
    }, [stop, startWeb, startNative]);

    useEffect(() => stop, [stop]);

    return { heading, status, start, stop };
};
