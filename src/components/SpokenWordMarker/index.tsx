import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleProp, Text, TextStyle, View } from 'react-native';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { BACKDROP_OVERLAP, CLIP_PAD_X, createStyles, WIDTH_SLACK } from './index.styles';

export { MARKER_SPACE } from './index.styles';

/** Backdrop for a word that is already fully recited; render it before the word's text so it stays behind. */
export const RecitedBackdrop: React.FC<{ padX: number }> = ({ padX }) => {
    const styles = useThemedStyles(createStyles);
    return <View style={[styles.backdropFull, { left: -(padX + BACKDROP_OVERLAP), right: -(padX + BACKDROP_OVERLAP) }]} pointerEvents="none" />;
};

/** Style for the plain word while it is being recited (the marker draws its letters itself). */
export const useHiddenWordStyle = () => useThemedStyles(createStyles).hiddenWord;

interface SpokenWordMarkerProps {
    /** The word being recited, drawn again on top in the highlight color. */
    word: string;
    /** Same style as the plain word, so both copies of the letters coincide. */
    textStyle: StyleProp<TextStyle>;
    elapsedMs: number;
    durationMs: number;
    isPlaying: boolean;
    playbackRate: number;
    /** Half the space between words, so the bands of neighboring words meet without gap or overlap. */
    padX: number;
}

/**
 * Sits on top of a word in a relatively positioned wrapper (whose own text should use useHiddenWordStyle).
 * While the word is recited its letters are colored from the right, and a small triangle under the word
 * points at the edge of the colored part. Mount it per word so every word starts its own sweep.
 */
export const SpokenWordMarker: React.FC<SpokenWordMarkerProps> = ({ word, textStyle, elapsedMs, durationMs, isPlaying, playbackRate, padX }) => {
    const styles = useThemedStyles(createStyles);
    const progress = useRef(new Animated.Value(Math.min(Math.max(elapsedMs / durationMs, 0), 1))).current;
    const [wordWidth, setWordWidth] = useState(0);
    // A negative elapsed time means the word starts shortly; wait that long before filling
    const startDelayMs = useRef(Math.max(-elapsedMs, 0)).current;

    useEffect(() => {
        if (!isPlaying) {
            progress.stopAnimation();
            return;
        }
        progress.stopAnimation(value => {
            Animated.timing(progress, {
                toValue: 1,
                duration: ((1 - value) * durationMs) / playbackRate,
                delay: value === 0 ? startDelayMs / playbackRate : 0,
                easing: Easing.linear,
                useNativeDriver: false,
            }).start();
        });
        return () => progress.stopAnimation();
    }, [isPlaying, progress, durationMs, playbackRate, startDelayMs]);

    // Clip widths in px: each half also covers its padding past the word's outer end (see the clip styles)
    const recitedWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [CLIP_PAD_X, CLIP_PAD_X + wordWidth] });
    const pendingWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [CLIP_PAD_X + wordWidth, CLIP_PAD_X] });
    // The backdrop grows from the word's right end
    const backdropWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [padX + BACKDROP_OVERLAP, wordWidth + 2 * (padX + BACKDROP_OVERLAP)] });
    // The pointer rides the edge between the halves
    const pointerRight = progress.interpolate({ inputRange: [0, 1], outputRange: [0, wordWidth] });

    return (
        <View style={styles.overlay} pointerEvents="none" onLayout={(e: LayoutChangeEvent) => setWordWidth(e.nativeEvent.layout.width)}>
            {/* Until the word is measured, show it whole so the letters never vanish */}
            {wordWidth === 0 ? (
                <Text style={[textStyle, styles.word]}>{word}</Text>
            ) : (
                <>
                    <Animated.View style={[styles.backdrop, { right: -(padX + BACKDROP_OVERLAP), width: backdropWidth }]} />
                    {/* Both copies are as wide as the word (plus slack) and right-aligned, so the letters coincide with the plain word */}
                    <Animated.View style={[styles.pendingClip, { width: pendingWidth }]}>
                        <View style={[styles.pendingInner, { width: wordWidth + WIDTH_SLACK }]}>
                            <Text style={[textStyle, styles.word]}>{word}</Text>
                        </View>
                    </Animated.View>
                    <Animated.View style={[styles.recitedClip, { width: recitedWidth }]}>
                        <View style={[styles.recitedInner, { width: wordWidth + WIDTH_SLACK }]}>
                            <Text style={[textStyle, styles.word, styles.recitedText]}>{word}</Text>
                        </View>
                    </Animated.View>
                </>
            )}
            <Animated.View style={[styles.pointer, { right: pointerRight }]} />
        </View>
    );
};
