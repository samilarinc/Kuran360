import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { useNavigationHelpers } from '@/contexts/NavigationContext';

/**
 * The navigator shows one screen at a time, so a screen left for another one (a search left for a verse)
 * is unmounted. Its state is kept here per history entry: going back to that entry brings it back,
 * opening the screen anew (a new entry) starts empty. Entries dropped from the history are collected.
 */
const store = new WeakMap<object, Map<string, unknown>>();

const entryStore = (entry: object) => {
    let values = store.get(entry);
    if (!values) {
        values = new Map();
        store.set(entry, values);
    }
    return values;
};

/** The history entry the screen was opened in; fixed for the screen's lifetime. */
const useEntry = () => {
    const { currentEntry } = useNavigationHelpers();
    return useRef(currentEntry).current;
};

/** Whether this screen is coming back to its history entry with saved state (e.g. to skip re-running a search). */
export const useIsRestoredScreen = (): boolean => {
    const entry = useEntry();
    return useRef(store.get(entry)?.size ? true : false).current;
};

/** Like useState, but the value survives leaving the screen and coming back to it with "back". */
export function useScreenState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
    const values = entryStore(useEntry());
    const [value, setValue] = useState<T>(() => {
        if (values.has(key)) return values.get(key) as T;
        return typeof initial === 'function' ? (initial as () => T)() : initial;
    });
    useEffect(() => {
        values.set(key, value);
    }, [values, key, value]);
    return [value, setValue];
}

/**
 * Props for a ScrollView whose position comes back with the screen: the saved offset is applied
 * once the content is tall enough to scroll there (results may arrive after the first render).
 */
export const useScreenScroll = (key = 'scroll') => {
    const values = entryStore(useEntry());
    const ref = useRef<ScrollView>(null);
    const pending = useRef((values.get(key) as number | undefined) ?? 0);

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        values.set(key, event.nativeEvent.contentOffset.y);
    }, [values, key]);

    const onContentSizeChange = useCallback((_width: number, height: number) => {
        const y = pending.current;
        if (y <= 0 || height < y) return;
        pending.current = 0;
        ref.current?.scrollTo({ y, animated: false });
    }, []);

    return { ref, onScroll, onContentSizeChange, scrollEventThrottle: 100 };
};
