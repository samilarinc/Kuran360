import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CircleDot, SkipForward, Repeat, Repeat1, ListEnd, Play, Pause, Square, LocateFixed, LocateOff, type LucideIcon } from 'lucide-react-native';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { getSurahNameByNumber } from '@/utils/surahName';
import { AppSettings } from '@/types';
import { createStyles } from './index.styles';

type PlayMode = 'singleVerse' | AppSettings['audioPlayMode'];

// Tapping the mode button cycles through these in order. 'singleVerse' is autoplay off;
// it also sets stopAtEnd because the player applies the end-of-surah mode even without autoplay.
const PLAY_MODES: { key: PlayMode; Icon: LucideIcon; settings: Partial<AppSettings> }[] = [
    { key: 'singleVerse', Icon: CircleDot, settings: { autoplayEnabled: false, audioPlayMode: 'stopAtEnd' } },
    { key: 'nextSurah', Icon: SkipForward, settings: { autoplayEnabled: true, audioPlayMode: 'nextSurah' } },
    { key: 'loopSurah', Icon: Repeat, settings: { autoplayEnabled: true, audioPlayMode: 'loopSurah' } },
    { key: 'stopAtEnd', Icon: ListEnd, settings: { autoplayEnabled: true, audioPlayMode: 'stopAtEnd' } },
    { key: 'loopVerse', Icon: Repeat1, settings: { autoplayEnabled: true, audioPlayMode: 'loopVerse' } },
];

// loopVerse repeats regardless of autoplay, so autoplay off only means 'singleVerse' for the other modes
const getPlayMode = ({ autoplayEnabled, audioPlayMode }: AppSettings): PlayMode =>
    !autoplayEnabled && audioPlayMode !== 'loopVerse' ? 'singleVerse' : audioPlayMode;

const PLAYBACK_RATES = [1.0, 1.25, 1.5, 1.75, 2.0];
const HINT_DURATION_MS = 2000;
const ICON_SIZE = 18;

export const GlobalAudioBar: React.FC = () => {
    const { audioState, togglePlayPause, stop, changePlaybackRate } = useGlobalAudio();
    const { settings, updateSettings } = useSettings();
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { t } = useTranslation();
    const { goToSurahVerse } = useNavigationHelpers();

    // Short explanation shown in place of the verse info after tapping an icon-only button
    const [hint, setHint] = useState<string | null>(null);
    const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showHint = useCallback((text: string) => {
        if (hintTimer.current) clearTimeout(hintTimer.current);
        setHint(text);
        hintTimer.current = setTimeout(() => setHint(null), HINT_DURATION_MS);
    }, []);
    useEffect(() => () => {
        if (hintTimer.current) clearTimeout(hintTimer.current);
    }, []);

    const currentModeIndex = Math.max(0, PLAY_MODES.findIndex(m => m.key === getPlayMode(settings)));
    const currentMode = PLAY_MODES[currentModeIndex];

    const handleCyclePlayMode = useCallback(() => {
        const next = PLAY_MODES[(currentModeIndex + 1) % PLAY_MODES.length];
        updateSettings(next.settings);
        showHint(t(`audioBar.modes.${next.key}`));
    }, [currentModeIndex, updateSettings, showHint, t]);

    const handlePlaybackRateChange = useCallback(async () => {
        const nextRate = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(settings.playbackRate) + 1) % PLAYBACK_RATES.length];
        updateSettings({ playbackRate: nextRate });
        await changePlaybackRate(nextRate);
    }, [settings.playbackRate, updateSettings, changePlaybackRate]);

    const handleTrackingToggle = useCallback(async () => {
        const enabled = !settings.audioTrackingEnabled;
        updateSettings({ audioTrackingEnabled: enabled });
        showHint(t(enabled ? 'audioBar.trackingOn' : 'audioBar.trackingOff'));
        // When enabling tracking, jump to the currently playing verse regardless of screen
        if (enabled && audioState.currentVerse) {
            await goToSurahVerse(audioState.currentVerse.surahNumber, audioState.currentVerse.number - 1);
        }
    }, [settings.audioTrackingEnabled, updateSettings, showHint, t, audioState.currentVerse, goToSurahVerse]);

    const verse = audioState.currentVerse;
    const title = useMemo(
        () => (verse ? `${getSurahNameByNumber(t, verse.surahNumber)} · ${t('audioBar.verse', { number: verse.number })}` : ''),
        [verse, t],
    );

    if (!verse) {
        return null;
    }

    const status = audioState.isLoading
        ? t('audioBar.loading')
        : t(audioState.isPlaying ? 'audioBar.playing' : 'audioBar.paused');
    const ModeIcon = currentMode.Icon;
    const TrackingIcon = settings.audioTrackingEnabled ? LocateFixed : LocateOff;

    return (
        <View style={styles.audioBar}>
            <View style={styles.info}>
                {hint ? (
                    <Text style={styles.hint} numberOfLines={2}>{hint}</Text>
                ) : (
                    <>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        <Text style={styles.status} numberOfLines={1}>{status}</Text>
                    </>
                )}
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleCyclePlayMode}
                    accessibilityLabel={`${t('audioBar.modeLabel')}: ${t(`audioBar.modes.${currentMode.key}`)}`}
                >
                    <ModeIcon size={ICON_SIZE} color={theme.headerText} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleTrackingToggle}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: settings.audioTrackingEnabled }}
                    accessibilityLabel={t('audioBar.tracking')}
                >
                    <TrackingIcon
                        size={ICON_SIZE}
                        color={theme.headerText}
                        style={!settings.audioTrackingEnabled && styles.iconOff}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.rateButton}
                    onPress={handlePlaybackRateChange}
                    accessibilityLabel={t('audioBar.speed', { rate: settings.playbackRate })}
                >
                    <Text style={styles.rateText}>{settings.playbackRate}x</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={stop} accessibilityLabel={t('audioBar.stop')}>
                    <Square size={ICON_SIZE - 2} color={theme.headerText} fill={theme.headerText} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayPause}
                    accessibilityLabel={t(audioState.isPlaying ? 'audioBar.pause' : 'audioBar.play')}
                >
                    {audioState.isLoading ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : audioState.isPlaying ? (
                        <Pause size={20} color={theme.primary} fill={theme.primary} />
                    ) : (
                        <Play size={20} color={theme.primary} fill={theme.primary} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};
