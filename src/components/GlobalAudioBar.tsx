import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { useGlobalAudio } from '../contexts/AudioContext';
import { useNavigationHelpers } from '../contexts/NavigationContext';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { AudioTrackingToggle } from './AudioTrackingToggle';
import { FONT_SIZES, SPACING } from '../constants';

export const GlobalAudioBar: React.FC = () => {
    const { audioState, togglePlayPause, stop, changePlaybackRate } = useGlobalAudio();
    const { settings, updateSettings } = useDebouncedSettings(200);
    const { theme } = useTheme();
    const { goToSurahVerse } = useNavigationHelpers();
    const { width } = useWindowDimensions();
    const isCompact = width < 380; // compact layout for small phones
    const isMedium = width >= 380 && width < 580; // medium phones - expanded range
    const hideLabels = isCompact || isMedium;

    // Memoize toggle handlers to prevent unnecessary re-renders
    const handleAudioTrackingToggle = useCallback(async (enabled: boolean) => {
        updateSettings({ audioTrackingEnabled: enabled });
        // When enabling tracking, jump to the currently playing verse regardless of screen
        if (enabled && audioState.currentVerse) {
            await goToSurahVerse(audioState.currentVerse.surahNumber, audioState.currentVerse.number - 1);
        }
    }, [updateSettings, audioState.currentVerse, goToSurahVerse]);

    const handlePlaybackRateChange = useCallback(async () => {
        // Toggle between 1x, 1.25x, 1.5x, 1.75x, 2x speeds
        const rates = [1.0, 1.25, 1.5, 1.75, 2.0];
        const currentIndex = rates.indexOf(settings.playbackRate);
        const nextIndex = (currentIndex + 1) % rates.length;
        const newRate = rates[nextIndex];

        updateSettings({ playbackRate: newRate });
        await changePlaybackRate(newRate);
    }, [settings.playbackRate, updateSettings, changePlaybackRate]);

    const playbackRateText = React.useMemo(() => `${settings.playbackRate}x`, [settings.playbackRate]);

    const statusLabel = React.useMemo(() => {
        if (audioState.isLoading) return 'Yükleniyor...';
        return audioState.isPlaying ? 'Çalıyor' : 'Duraklatıldı';
    }, [audioState.isLoading, audioState.isPlaying]);

    const verseLabel = React.useMemo(() => {
        return audioState.currentVerse ? `${audioState.currentVerse.number}. Ayet` : '';
    }, [audioState.currentVerse]);

    // Cycle audio play modes: nextSurah -> loopSurah -> stopAtEnd -> loopVerse
    const playModes: Array<{ key: 'nextSurah' | 'loopSurah' | 'stopAtEnd' | 'loopVerse'; icon: string; label: string }> = [
        { key: 'nextSurah', icon: '⏭️📖', label: 'Sonraki Sure' },
        { key: 'loopSurah', icon: '🔁📖', label: 'Sure Döngü' },
        { key: 'stopAtEnd', icon: '⏹️📖', label: 'Surenin Sonunda Dur' },
        { key: 'loopVerse', icon: '🔁🔢', label: 'Ayet Döngü' },
    ];

    const currentModeIndex = Math.max(0, playModes.findIndex(m => m.key === (settings as any).audioPlayMode));
    const currentMode = currentModeIndex >= 0 ? playModes[currentModeIndex] : playModes[0];

    const handleCyclePlayMode = useCallback(() => {
        const nextIndex = (currentModeIndex + 1) % playModes.length;
        updateSettings({ audioPlayMode: playModes[nextIndex].key } as any);
    }, [currentModeIndex, updateSettings]);

    // Don't render if no audio is playing or paused
    if (!audioState.currentVerse) {
        return null;
    }

    const styles = createStyles(theme, isCompact, isMedium);

    return (
        <View style={styles.audioBar}>
            <View style={styles.audioBarContent}>
                {isCompact ? (
                    <View style={styles.audioTextContainer}>
                        <Text
                            style={styles.audioText}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.65}
                        >
                            {statusLabel}
                        </Text>
                        {!!verseLabel && (
                            <Text
                                style={styles.verseText}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.85}
                            >
                                {verseLabel}
                            </Text>
                        )}
                    </View>
                ) : (
                    <Text
                        style={styles.audioText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                    >
                        {audioState.isLoading ? statusLabel : `${statusLabel}: ${verseLabel}`}
                    </Text>
                )}
                <View style={styles.audioControls}>
                    {/* Play Mode Button with label */}
                    <View style={styles.playModeContainer}>
                        <TouchableOpacity
                            style={styles.playModeButton}
                            onPress={handleCyclePlayMode}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.playModeIcon}>{currentMode.icon}</Text>
                        </TouchableOpacity>
                        {!hideLabels && (
                            <Text style={styles.playModeLabel}>{currentMode.label}</Text>
                        )}
                    </View>

                    {/* Play/Pause Button */}
                    <TouchableOpacity
                        style={styles.playPauseButton}
                        onPress={togglePlayPause}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.playPauseIcon}>
                            {audioState.isPlaying ? '⏸️' : '▶️'}
                        </Text>
                    </TouchableOpacity>

                    {/* Stop Button */}
                    <TouchableOpacity
                        style={styles.stopButton}
                        onPress={stop}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.stopIcon}>⏹️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playbackRateButton}
                        onPress={handlePlaybackRateChange}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.playbackRateText}>
                            {playbackRateText}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.audioTrackingContainer}>
                        <AudioTrackingToggle
                            isEnabled={settings.audioTrackingEnabled}
                            onToggle={handleAudioTrackingToggle}
                        />
                        {!hideLabels && (
                            <Text style={styles.audioTrackingLabel}>
                                Otomatik takip
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, isCompact: boolean, isMedium: boolean) => StyleSheet.create({
    audioBar: {
        backgroundColor: theme.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.primary + '40',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: '100%',
        overflow: 'hidden',
    },
    audioBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        flexWrap: isCompact ? 'wrap' : 'nowrap',
        rowGap: isCompact ? SPACING.sm : 0,
        columnGap: isCompact ? SPACING.sm : (isMedium ? SPACING.sm : SPACING.md),
    },
    audioTextContainer: {
        flex: 1,
        minWidth: 0,
    },
    audioText: {
        color: theme.headerText,
        fontSize: isCompact ? 14 : (isMedium ? 13 : FONT_SIZES.medium),
        fontWeight: '500',
        flex: 1,
        marginRight: SPACING.md,
        minWidth: 0, // allow shrinking with ellipsis
    },
    verseText: {
        color: theme.headerText,
        fontSize: isCompact ? 11 : (isMedium ? 12 : FONT_SIZES.small),
        opacity: 0.9,
    },
    audioControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: isCompact ? SPACING.sm : (isMedium ? SPACING.sm : SPACING.md),
        flexShrink: 0,
        flexWrap: isCompact ? 'wrap' : 'nowrap',
        justifyContent: 'flex-end',
    },
    playModeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    playModeButton: {
        backgroundColor: theme.headerText + '20',
        width: isCompact ? 36 : (isMedium ? 38 : 40),
        height: isCompact ? 36 : (isMedium ? 38 : 40),
        borderRadius: isCompact ? 18 : (isMedium ? 19 : 20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    playModeIcon: {
        fontSize: isCompact ? 14 : (isMedium ? 16 : 16),
        color: theme.headerText,
    },
    playModeLabel: {
        marginTop: 4,
        fontSize: isCompact ? 10 : (isMedium ? 11 : FONT_SIZES.small),
        color: theme.headerText,
        opacity: 0.85,
        textAlign: 'center',
    },
    playPauseButton: {
        backgroundColor: theme.headerText + '20',
        width: isCompact ? 36 : (isMedium ? 38 : 40),
        height: isCompact ? 36 : (isMedium ? 38 : 40),
        borderRadius: isCompact ? 18 : (isMedium ? 19 : 20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    playPauseIcon: {
        fontSize: isCompact ? 16 : (isMedium ? 17 : 18),
        color: theme.headerText,
    },
    stopButton: {
        backgroundColor: theme.headerText + '20',
        width: isCompact ? 36 : (isMedium ? 38 : 40),
        height: isCompact ? 36 : (isMedium ? 38 : 40),
        borderRadius: isCompact ? 18 : (isMedium ? 19 : 20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopIcon: {
        fontSize: isCompact ? 16 : (isMedium ? 17 : 18),
        color: theme.headerText,
    },
    playbackRateButton: {
        backgroundColor: theme.headerText + '20',
        paddingHorizontal: isCompact ? 6 : (isMedium ? 8 : SPACING.sm),
        paddingVertical: isCompact ? 3 : (isMedium ? 4 : 4),
        borderRadius: 6,
        minWidth: 40,
        alignItems: 'center',
    },
    playbackRateText: {
        color: theme.headerText,
        fontSize: isCompact ? 12 : (isMedium ? 13 : FONT_SIZES.small),
        fontWeight: '600',
    },
    audioTrackingContainer: {
        alignItems: 'center',
        gap: 4,
    },
    audioTrackingLabel: {
        color: theme.headerText,
        fontSize: isCompact ? 10 : (isMedium ? 11 : FONT_SIZES.small),
        opacity: 0.8,
        textAlign: 'center',
    },
});
