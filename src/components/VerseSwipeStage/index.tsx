import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, PanResponder, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface VerseSwipeStageProps {
    /** Changes when another verse is shown; a larger key slides in as "next", a smaller one as "previous". */
    pageKey: number;
    canNext: boolean;
    canPrevious: boolean;
    onNext: () => void;
    onPrevious: () => void;
    /** No swiping while recording or checking. */
    disabled?: boolean;
    /** While set, a gilded line fills along the bottom edge for this long (the wait before moving on). */
    countdownMs?: number | null;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}

const SLIDE_MS = 180;

/**
 * A verse card that moves between verses like mushaf pages, right to left:
 * dragging to the right brings the next verse in from the left, dragging to the left goes back.
 */
export const VerseSwipeStage: React.FC<VerseSwipeStageProps> = ({
    pageKey,
    canNext,
    canPrevious,
    onNext,
    onPrevious,
    disabled = false,
    countdownMs,
    style,
    children,
}) => {
    const { theme } = useTheme();
    const reduceMotion = useReduceMotion();
    const translateX = useRef(new Animated.Value(0)).current;
    const countdown = useRef(new Animated.Value(0)).current;
    const [width, setWidth] = useState(0);
    const previousKey = useRef(pageKey);

    // The pan responder is created once; it reads the latest props through this ref
    const latest = useRef({ canNext, canPrevious, onNext, onPrevious, disabled, width, reduceMotion });
    latest.current = { canNext, canPrevious, onNext, onPrevious, disabled, width, reduceMotion };

    // A new verse slides in from the side it came from, whatever moved to it (swipe, buttons, auto-advance)
    useEffect(() => {
        if (pageKey === previousKey.current) return;
        const forward = pageKey > previousKey.current;
        previousKey.current = pageKey;
        if (reduceMotion || width === 0) {
            translateX.setValue(0);
            return;
        }
        translateX.setValue(forward ? -width * 0.35 : width * 0.35);
        Animated.timing(translateX, { toValue: 0, duration: SLIDE_MS * 1.4, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, [pageKey, reduceMotion, width, translateX]);

    useEffect(() => {
        countdown.stopAnimation();
        countdown.setValue(0);
        if (!countdownMs) return;
        Animated.timing(countdown, { toValue: 1, duration: countdownMs, easing: Easing.linear, useNativeDriver: false }).start();
    }, [countdownMs, countdown]);

    const springBack = () =>
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();

    const pan = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
            !latest.current.disabled && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => {
            const { canNext: next, canPrevious: previous } = latest.current;
            // Rubber band at the ends of the range
            const blocked = (g.dx > 0 && !next) || (g.dx < 0 && !previous);
            translateX.setValue(blocked ? g.dx * 0.25 : g.dx);
        },
        onPanResponderRelease: (_, g) => {
            const { canNext: next, canPrevious: previous, onNext: goNext, onPrevious: goPrevious, width: w, reduceMotion: still } = latest.current;
            const threshold = Math.min(w * 0.25, 90);
            const fling = Math.abs(g.vx) > 0.4 && Math.abs(g.dx) > 24;
            const forward = g.dx > 0;
            const passed = Math.abs(g.dx) > threshold || fling;
            if (!passed || (forward && !next) || (!forward && !previous)) {
                springBack();
                return;
            }
            const go = forward ? goNext : goPrevious;
            if (still) {
                translateX.setValue(0);
                go();
                return;
            }
            Animated.timing(translateX, {
                toValue: forward ? w : -w,
                duration: SLIDE_MS,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(go);
        },
        onPanResponderTerminate: springBack,
    })).current;

    const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

    return (
        <Animated.View
            {...pan.panHandlers}
            onLayout={onLayout}
            style={[style, styles.clip, { transform: [{ translateX }] }]}
        >
            {children}
            {!!countdownMs && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.countdown,
                        {
                            backgroundColor: theme.accent,
                            // Fills from the right edge, the way the next verse is read
                            width: countdown.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        },
                    ]}
                />
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    clip: {
        overflow: 'hidden',
    },
    countdown: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        height: 3,
    },
});
