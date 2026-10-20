import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pause, Play } from 'lucide-react-native';
import { ProgressBar } from '@/components/ProgressBar';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import type { DhikrAudioState } from '@/hooks/useDhikrAudio';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

const PLAY_SIZE = 40;
// Slower than normal too, for reciting along
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

interface DhikrAudioBarProps {
    title: string;
    /** Shown under the title until the recording is loaded. */
    hint: string;
    state: DhikrAudioState;
    rate: number;
    onToggle: () => void;
    onSeek: (seconds: number) => void;
    onRateChange: (rate: number) => void;
}

const formatClock = (seconds: number) => {
    const whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

/** Play/pause, a title, a seekable progress line and the speed for a recording. */
export const DhikrAudioBar: React.FC<DhikrAudioBarProps> = ({ title, hint, state, rate, onToggle, onSeek, onRateChange }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [width, setWidth] = useState(0);
    const { isPlaying, isLoading, failed, position, duration } = state;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.playButton}
                onPress={onToggle}
                disabled={isLoading}
                accessibilityLabel={isPlaying ? t('zikirmatik.audio.pause') : t('zikirmatik.audio.play')}
            >
                {isLoading
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : isPlaying
                        ? <Pause size={18} color="#FFFFFF" fill="#FFFFFF" />
                        : <Play size={18} color="#FFFFFF" fill="#FFFFFF" />}
            </TouchableOpacity>
            <View style={styles.info}>
                <View style={common.rowBetween}>
                    <Text style={common.textStrong} numberOfLines={1}>{title}</Text>
                    {duration > 0 && (
                        <Text style={common.smallText}>{formatClock(position)} / {formatClock(duration)}</Text>
                    )}
                </View>
                {failed ? (
                    <Text style={[common.smallText, { color: theme.error }]}>{t('zikirmatik.audio.loadError')}</Text>
                ) : duration > 0 ? (
                    <Pressable
                        style={styles.seekArea}
                        onLayout={event => setWidth(event.nativeEvent.layout.width)}
                        onPress={event => width > 0 && onSeek((event.nativeEvent.locationX / width) * duration)}
                        accessibilityRole="adjustable"
                    >
                        <ProgressBar progress={(position / duration) * 100} height={4} />
                    </Pressable>
                ) : (
                    <Text style={common.smallText}>{hint}</Text>
                )}
            </View>
            <TouchableOpacity
                style={styles.rateButton}
                onPress={() => onRateChange(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
                accessibilityLabel={t('audioBar.speed', { rate })}
            >
                <Text style={styles.rateText}>{rate}x</Text>
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    container: {
        ...common.sectionCardCompact,
        ...common.row,
        gap: SPACING.md,
    },
    playButton: {
        width: PLAY_SIZE,
        height: PLAY_SIZE,
        borderRadius: PLAY_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary,
    },
    info: {
        ...common.flex1,
        gap: SPACING.xs,
    },
    // Taller than the bar so it's easy to hit
    seekArea: {
        paddingVertical: SPACING.sm,
    },
    rateButton: {
        minWidth: PLAY_SIZE,
        height: PLAY_SIZE / 1.5,
        borderRadius: PLAY_SIZE / 3,
        paddingHorizontal: SPACING.xs,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary + '15',
    },
    rateText: {
        ...common.textStrong,
        fontSize: FONT_SIZES.small,
        color: theme.primary,
    },
});
