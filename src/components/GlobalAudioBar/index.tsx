import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useDebouncedSettings } from '@/hooks/useDebouncedSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { AudioTrackingToggle } from '../AudioTrackingToggle';
import { createStyles } from './index.styles';

// Cycle audio play modes: nextSurah -> loopSurah -> stopAtEnd -> loopVerse
const PLAY_MODES: Array<{ key: 'nextSurah' | 'loopSurah' | 'stopAtEnd' | 'loopVerse'; icon: string; label: string }> = [
    { key: 'nextSurah', icon: '⏭️📖', label: 'Sonraki Sure' },
    { key: 'loopSurah', icon: '🔁📖', label: 'Sure Döngü' },
    { key: 'stopAtEnd', icon: '⏹️📖', label: 'Surenin Sonunda Dur' },
    { key: 'loopVerse', icon: '🔁🔢', label: 'Ayet Döngü' },
];

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

    const currentModeIndex = Math.max(0, PLAY_MODES.findIndex(m => m.key === (settings as any).audioPlayMode));
    const currentMode = currentModeIndex >= 0 ? PLAY_MODES[currentModeIndex] : PLAY_MODES[0];

    const handleCyclePlayMode = useCallback(() => {
        const nextIndex = (currentModeIndex + 1) % PLAY_MODES.length;
        updateSettings({ audioPlayMode: PLAY_MODES[nextIndex].key } as any);
    }, [currentModeIndex, updateSettings]);

    const styles = useMemo(() => createStyles(theme, isCompact, isMedium), [theme, isCompact, isMedium]);

    // Don't render if no audio is playing or paused
    if (!audioState.currentVerse) {
        return null;
    }

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
