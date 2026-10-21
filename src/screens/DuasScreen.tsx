import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Linking, SafeAreaView, ScrollView, StyleProp, Text, TextStyle, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ExternalLink, HandHeart } from 'lucide-react-native';
import { AppButton } from '@/components/AppButton';
import { FontSizeToggle } from '@msarinc/ui';
import { AppHeader } from '@/components/AppHeader';
import { DhikrAudioBar } from '@/components/DhikrAudioBar';
import { MenuListRow } from '@/components/MenuListRow';
import { RecitedBackdrop, SpokenWordMarker, useHiddenWordStyle } from '@/components/SpokenWordMarker';
import { createStyles as createVerseStyles } from '@/components/Verse/index.styles';
import { getArabicFontFamily, getFontOption, SURAH_FONT_SIZE } from '@/constants/fonts';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { Dua, DUAS, partAtTime } from '@/data/duas';
import type { ActiveWord } from '@/hooks/useActiveWordIndex';
import { useDhikrAudio } from '@/hooks/useDhikrAudio';
import { formatVerseNumber } from '@/utils/numerals';
import { createStyles } from './DuasScreen.styles';

// A word held long (crying, a pause) still sweeps in this time, then stays lit
const MAX_WORD_MS = 3000;
// Between the player's position reports the position is extrapolated from the clock, as for the verses
const EXTRAPOLATE_INTERVAL_MS = 40;

/** The word being recited at `seconds`: its part and index, or null between parts / before the first word. */
const wordAtTime = (dua: Dua, seconds: number, duration: number) => {
    const part = partAtTime(dua, seconds);
    const starts = dua.parts[part]?.words;
    if (!starts) return null;
    let index = -1;
    for (let i = 0; i < starts.length && starts[i] <= seconds; i++) index = i;
    if (index < 0) return null;
    // The recording may be cut right after the last word
    const end = starts[index + 1] ?? dua.parts[part + 1]?.start ?? Math.min(starts[index] + MAX_WORD_MS / 1000, duration);
    return {
        part,
        index,
        elapsedMs: (seconds - starts[index]) * 1000,
        durationMs: Math.min(Math.max((end - starts[index]) * 1000, 1), MAX_WORD_MS),
    };
};

interface DuasScreenProps {
    navigation: any;
    /** The open dua; the list when not given. */
    duaId?: string;
}

/** Ready-made duas, read like the verses: the same cards, Arabic font and text size. */
export const DuasScreen: React.FC<DuasScreenProps> = ({ navigation, duaId }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const dua = DUAS.find(d => d.id === duaId);

    if (dua) return <DuaReader dua={dua} onBack={() => navigation.goBack()} onHome={() => navigation.navigate('Main')} />;

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('duas.title')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
            />
            <ScrollView contentContainerStyle={common.listContent}>
                {DUAS.map(item => (
                    <MenuListRow
                        key={item.id}
                        variant="card"
                        icon={<HandHeart size={26} color={theme.primary} />}
                        iconColor={theme.primary + '15'}
                        title={t(`duas.items.${item.id}.title`)}
                        subtitle={t(`duas.items.${item.id}.description`)}
                        onPress={() => navigation.navigate('Duas', { duaId: item.id })}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const DuaReader: React.FC<{ dua: Dua; onBack: () => void; onHome: () => void }> = ({ dua, onBack, onHome }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const { settings, updateSettings } = useSettings();
    const verseStyles = useThemedStyles(createVerseStyles);
    const styles = useThemedStyles(createStyles);
    const verseAudio = useGlobalAudio();
    const [rate, setRate] = useState(1);
    const scrollRef = useRef<ScrollView>(null);
    const partOffsets = useRef<number[]>([]);

    const meanings = t(`duas.items.${dua.id}.parts`, { returnObjects: true }) as string[];
    const fontSize = settings.surahFontSize;
    const arabicStyle = [
        common.arabicText,
        { fontFamily: getArabicFontFamily(getFontOption(settings.arabicFont), true), fontSize, lineHeight: fontSize * 1.8 },
    ];

    // Back to the start once it ends, which also clears the highlights
    const player = useDhikrAudio(dua.audio?.url ?? null, rate, () => { }, () => player.seek(0));
    const activePart = player.state.duration > 0 ? partAtTime(dua, player.state.position) : -1;

    // Word-by-word highlighting, like the verses of reciters with word timings
    const tracking = settings.wordTrackingEnabled && dua.parts.some(part => part.words);
    const [activeWord, setActiveWord] = useState<(Omit<ActiveWord, 'isPlaying'> & { part: number }) | null>(null);
    const { position, isPlaying, duration } = player.state;
    useEffect(() => {
        if (!tracking || duration === 0) {
            setActiveWord(null);
            return;
        }
        // Only re-renders when the word changes, not on every tick
        const moveTo = (seconds: number) => {
            const next = wordAtTime(dua, seconds, duration);
            setActiveWord(prev => (prev?.part === next?.part && prev?.index === next?.index ? prev : next));
        };
        moveTo(position);
        const at = Date.now();
        const timer = isPlaying
            ? setInterval(() => moveTo(position + ((Date.now() - at) / 1000) * rate), EXTRAPOLATE_INTERVAL_MS)
            : null;
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [tracking, dua, position, isPlaying, duration, rate]);

    // Keep the part being recited in view
    useEffect(() => {
        if (!player.state.isPlaying || activePart < 0) return;
        scrollRef.current?.scrollTo({ y: Math.max(0, (partOffsets.current[activePart] ?? 0) - 8), animated: true });
    }, [activePart, player.state.isPlaying]);

    const toggleAudio = () => {
        if (player.state.isPlaying) {
            player.pause();
            return;
        }
        if (verseAudio.audioState.isPlaying) verseAudio.pause();
        player.play();
    };

    const playFrom = (start?: number) => {
        if (start === undefined) return;
        if (verseAudio.audioState.isPlaying) verseAudio.pause();
        player.play(start);
    };

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t(`duas.items.${dua.id}.title`)}
                showBackButton
                onBackPress={onBack}
                showHomeButton
                onHomePress={onHome}
                fontSizeToggle={
                    <FontSizeToggle
                        onDecrease={() => updateSettings({ surahFontSize: Math.max(SURAH_FONT_SIZE.min, fontSize - SURAH_FONT_SIZE.step) })}
                        onIncrease={() => updateSettings({ surahFontSize: Math.min(SURAH_FONT_SIZE.max, fontSize + SURAH_FONT_SIZE.step) })}
                        disabledDecrease={fontSize <= SURAH_FONT_SIZE.min}
                        disabledIncrease={fontSize >= SURAH_FONT_SIZE.max}
                        labels={{
                            decrease: t('surahDetailScreen.decreaseFontSize'),
                            increase: t('surahDetailScreen.increaseFontSize'),
                        }}
                    />
                }
            />
            {dua.audio && (
                <View style={styles.audioBar}>
                    <DhikrAudioBar
                        title={dua.audio.reciter ? t('duas.listenWith', { reciter: dua.audio.reciter }) : t('duas.listen')}
                        hint={t('duas.audioHint')}
                        state={player.state}
                        rate={rate}
                        onToggle={toggleAudio}
                        onSeek={player.seek}
                        onRateChange={setRate}
                    />
                </View>
            )}
            <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
                <Text style={styles.description}>{t(`duas.items.${dua.id}.description`)}</Text>
                {dua.parts.map((part, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        disabled={!dua.audio || part.start === undefined}
                        onPress={() => playFrom(part.start)}
                        onLayout={event => { partOffsets.current[index] = event.nativeEvent.layout.y; }}
                        style={[verseStyles.container, index === activePart && styles.activePart]}
                    >
                        <View style={[common.row, common.mbMd]}>
                            <View style={verseStyles.verseNumber}>
                                <Text style={verseStyles.verseNumberText}>{formatVerseNumber(index + 1, settings.verseNumberStyle)}</Text>
                            </View>
                        </View>
                        <View style={common.gapMd}>
                            {tracking && part.words ? (
                                <TrackedArabic
                                    text={part.arabic}
                                    textStyle={arabicStyle}
                                    active={activeWord?.part === index ? activeWord : null}
                                    isPlaying={isPlaying}
                                    rate={rate}
                                />
                            ) : (
                                <Text style={arabicStyle}>{part.arabic}</Text>
                            )}
                            {settings.showTransliteration && part.transliteration && (
                                <Text style={verseStyles.transliterationText}>{part.transliteration}</Text>
                            )}
                            {meanings[index] && (
                                <View style={verseStyles.translationContainer}>
                                    <Text style={verseStyles.translationText}>{meanings[index]}</Text>
                                </View>
                            )}
                            {part.article && (
                                <AppButton
                                    title={t('duas.articleLink', { title: part.article.title })}
                                    icon={<ExternalLink size={14} color={theme.primary} />}
                                    variant="ghost"
                                    size="small"
                                    style={styles.articleLink}
                                    onPress={() => Linking.openURL(part.article!.url).catch(() => { })}
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

/** Arabic laid out word by word (as in the verse cards), with the recited words lit and the current one sweeping. */
const TrackedArabic: React.FC<{
    text: string;
    textStyle: StyleProp<TextStyle>;
    active: Omit<ActiveWord, 'isPlaying'> | null;
    isPlaying: boolean;
    rate: number;
}> = ({ text, textStyle, active, isPlaying, rate }) => {
    const verseStyles = useThemedStyles(createVerseStyles);
    const hiddenWordStyle = useHiddenWordStyle();
    // The recited-word bands extend half the space between words on each side
    const [spaceWidth, setSpaceWidth] = useState(0);
    const words = text.split(' ');

    return (
        <View style={verseStyles.inlineArabicRow}>
            {words.map((word, index) => (
                <View key={index} style={verseStyles.inlineArabicWordWrap}>
                    <View style={verseStyles.spokenWordBox}>
                        {active && index < active.index && <RecitedBackdrop padX={spaceWidth / 2} />}
                        <Text style={[textStyle, active && index < active.index && verseStyles.recitedWord, active?.index === index && hiddenWordStyle]}>
                            {word}
                        </Text>
                        {active?.index === index && (
                            <SpokenWordMarker
                                word={word}
                                textStyle={textStyle}
                                elapsedMs={active.elapsedMs}
                                durationMs={active.durationMs}
                                isPlaying={isPlaying}
                                playbackRate={rate}
                                padX={spaceWidth / 2}
                            />
                        )}
                    </View>
                    {index < words.length - 1 && (
                        <Text
                            style={textStyle}
                            onLayout={index === 0 ? (e: LayoutChangeEvent) => setSpaceWidth(e.nativeEvent.layout.width) : undefined}
                        > </Text>
                    )}
                </View>
            ))}
        </View>
    );
};
