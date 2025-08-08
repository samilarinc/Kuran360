import { useCallback, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { AppSettings } from '../types';

interface DebouncedUpdateFunction {
    (newSettings: Partial<AppSettings>): void;
    flush?: () => void;
    cancel?: () => void;
}

export const useDebouncedSettings = (delay: number = 300) => {
    const { settings, updateSettings, availableTranslations, availableReciters } = useSettings();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingUpdatesRef = useRef<Partial<AppSettings>>({});
    const isFlushingRef = useRef(false);

    const debouncedUpdateSettings: DebouncedUpdateFunction = useCallback((newSettings: Partial<AppSettings>) => {
        // Prevent new updates while flushing
        if (isFlushingRef.current) {
            return;
        }

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Accumulate pending updates
        pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...newSettings };

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            isFlushingRef.current = true;
            const updates = { ...pendingUpdatesRef.current };
            pendingUpdatesRef.current = {};
            updateSettings(updates);
            timeoutRef.current = null;
            isFlushingRef.current = false;
        }, delay);
    }, [updateSettings, delay]);

    // Function to immediately flush pending updates
    debouncedUpdateSettings.flush = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            isFlushingRef.current = true;
            const updates = { ...pendingUpdatesRef.current };
            pendingUpdatesRef.current = {};
            updateSettings(updates);
            timeoutRef.current = null;
            isFlushingRef.current = false;
        }
    }, [updateSettings]);

    // Function to cancel pending updates
    debouncedUpdateSettings.cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            pendingUpdatesRef.current = {};
        }
    }, []);

    return {
        settings,
        updateSettings: debouncedUpdateSettings,
        immediateUpdateSettings: updateSettings, // For cases where immediate update is needed
        availableTranslations,
        availableReciters,
    };
};
