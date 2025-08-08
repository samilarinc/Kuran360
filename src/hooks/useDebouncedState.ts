import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for debounced state management to prevent flickering
 * Provides immediate UI feedback while debouncing actual state changes
 */
export const useDebouncedState = <T>(
    initialValue: T,
    externalValue: T,
    onStateChange: (value: T) => void,
    delay: number = 200
) => {
    const [displayValue, setDisplayValue] = useState<T>(externalValue);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingValueRef = useRef<T | null>(null);
    const isChangingRef = useRef(false);

    // Sync display value with external value only when not actively changing
    useEffect(() => {
        if (!isChangingRef.current && pendingValueRef.current === null) {
            setDisplayValue(externalValue);
        }
    }, [externalValue]);

    const updateValue = useCallback((newValue: T) => {
        // Update display value immediately for instant UI feedback
        setDisplayValue(newValue);
        pendingValueRef.current = newValue;
        isChangingRef.current = true;

        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout for actual state change
        debounceTimeoutRef.current = setTimeout(() => {
            const finalValue = pendingValueRef.current;
            pendingValueRef.current = null;
            isChangingRef.current = false;

            if (finalValue !== null && finalValue !== externalValue) {
                onStateChange(finalValue);
            }
        }, delay);
    }, [onStateChange, delay, externalValue]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    return {
        displayValue,
        updateValue,
        isPending: pendingValueRef.current !== null,
    };
};

/**
 * Specialized hook for boolean toggles with debouncing
 */
export const useDebouncedToggle = (
    externalValue: boolean,
    onToggle: (value: boolean) => void,
    delay: number = 200
) => {
    const { displayValue, updateValue, isPending } = useDebouncedState(
        externalValue,
        externalValue,
        onToggle,
        delay
    );

    const toggle = useCallback(() => {
        updateValue(!displayValue);
    }, [displayValue, updateValue]);

    return {
        isEnabled: displayValue,
        toggle,
        isPending,
    };
};
