import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { SelectBox } from '@/components/SelectBox';
import { useSettings } from '@/contexts/SettingsContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { getEdition, getSurahTafsir, getTafsirSource, TAFSIR_SOURCES, TafsirBlock, TafsirSourceId } from '@/services/tafsir';
import { getSurahsList } from '@/data/quranData';
import { getSurahNameByNumber } from '@/utils/surahName';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

interface TafsirScreenProps {
    navigation: any;
    /** The surah to open; Fâtiha when none */
    surahNumber?: number;
    /** Opened from a verse's tafsir button: the verse whose block is scrolled to and marked */
    verseNumber?: number;
    updateTafsirUrl?: (surahNumber: number) => void;
}

const blockId = (index: number) => `tafsir-block-${index}`;

type State = { status: 'loading' } | { status: 'error' } | { status: 'done'; blocks: TafsirBlock[] };

/**
 * Tafsir reading: a surah's tafsir from start to end, block by block. The source and the surah are picked at the top;
 * the source is remembered in the settings. Opened from the main menu, or from a verse at that verse's block.
 */
export const TafsirScreen: React.FC<TafsirScreenProps> = ({ navigation, surahNumber: initialSurah, verseNumber, updateTafsirUrl }) => {
    const { theme, common } = useTheme();
    const { t, i18n } = useTranslation();
    const { settings, updateSettings } = useSettings();
    const styles = useThemedStyles(createStyles);
    const source = getTafsirSource(settings.tafsirSource);
    const edition = getEdition(source, i18n.language);
    const [surahNumber, setSurahNumber] = useState(initialSurah ?? 1);
    // The verse to scroll to; dropped once the reader picks another surah
    const [targetVerse, setTargetVerse] = useState(initialSurah ? verseNumber : undefined);
    const [state, setState] = useState<State>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);
    const listRef = useRef<FlatList<TafsirBlock>>(null);
    const { goToSurahVerse } = useNavigationHelpers();

    useEffect(() => {
        let cancelled = false;
        setState({ status: 'loading' });
        getSurahTafsir(edition, surahNumber)
            .then(blocks => !cancelled && setState({ status: 'done', blocks }))
            .catch(() => !cancelled && setState({ status: 'error' }));
        return () => {
            cancelled = true;
        };
    }, [edition, surahNumber, attempt]);

    const blocks = state.status === 'done' ? state.blocks : [];
    const targetIndex = targetVerse ? blocks.findIndex(b => b.from <= targetVerse && targetVerse <= b.to) : -1;

    // Scroll to the verse's block once the surah's blocks are in. Web renders them all in a ScrollView (like the
    // surah screen), where scrollIntoView is exact; native uses a FlatList, retried until the block is laid out.
    const scrollAttempts = useRef(0);
    useEffect(() => {
        if (state.status !== 'done') return;
        scrollAttempts.current = 0;
        const timer = setTimeout(() => {
            if (Platform.OS === 'web') {
                const doc = (globalThis as any).document;
                if (targetIndex > 0) doc?.getElementById(blockId(targetIndex))?.scrollIntoView({ block: 'start' });
            } else if (targetIndex > 0) {
                listRef.current?.scrollToIndex({ index: targetIndex, animated: false });
            } else {
                listRef.current?.scrollToOffset({ offset: 0, animated: false });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [state, targetIndex]);

    const sourceOptions = useMemo(
        () => TAFSIR_SOURCES.map(s => ({ value: s.id, label: t(`tafsir.sources.${s.id}.name`) })),
        [t],
    );
    const surahOptions = useMemo(
        () => getSurahsList().map(s => ({ value: String(s.number), label: t('tafsir.surahOption', { number: s.number, name: getSurahNameByNumber(t, s.number) }) })),
        [t],
    );

    const selectSurah = (value: string) => {
        const number = parseInt(value, 10);
        setSurahNumber(number);
        setTargetVerse(undefined);
        updateTafsirUrl?.(number);
    };

    const renderBlock = ({ item, index }: { item: TafsirBlock; index: number }) => (
        <View key={`${item.from}-${item.to}`} nativeID={blockId(index)} style={[styles.block, index === targetIndex && styles.blockTarget]}>
            {/* The verse numbers open the verse (the first one of a range) in the surah */}
            <TouchableOpacity
                style={[common.row, styles.blockVerses]}
                onPress={() => goToSurahVerse(surahNumber, item.from - 1)}
                accessibilityRole="link"
                activeOpacity={0.6}
            >
                <Text style={styles.blockVersesText}>
                    {item.from === item.to
                        ? t('tafsir.blockVerse', { verse: item.from })
                        : t('tafsir.blockRange', { from: item.from, to: item.to })}
                </Text>
                <ChevronRight size={14} color={theme.primary} strokeWidth={3} />
            </TouchableOpacity>
            <Text style={styles.body} selectable>{item.text}</Text>
        </View>
    );

    const empty = <Text style={[common.smallText, common.pMd]}>{t('tafsir.surahEmpty')}</Text>;
    const credit = (
        <Text style={[common.smallText, styles.credit]} onPress={source.sourceUrl ? () => Linking.openURL(source.sourceUrl!) : undefined}>
            {t(`tafsir.sources.${source.id}.credit`)}
        </Text>
    );

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.tafsir')}
                subtitle={getSurahNameByNumber(t, surahNumber)}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <View style={[common.row, styles.pickers]}>
                <SelectBox<TafsirSourceId>
                    style={styles.sourcePicker}
                    options={sourceOptions}
                    value={source.id}
                    onChange={id => updateSettings({ tafsirSource: id })}
                />
                <SelectBox style={styles.surahPicker} options={surahOptions} value={String(surahNumber)} onChange={selectSurah} />
            </View>

            {state.status === 'loading' && <ActivityIndicator color={theme.primary} style={common.pLg} />}
            {state.status === 'error' && (
                <View style={[common.gapSm, common.pMd]}>
                    <Text style={common.text}>{t('tafsir.loadError')}</Text>
                    <Text style={common.smallText}>{t('tafsir.downloadHint')}</Text>
                    <TouchableOpacity onPress={() => setAttempt(a => a + 1)}>
                        <Text style={[common.textStrong, common.textAccent]}>{t('tafsir.retry')}</Text>
                    </TouchableOpacity>
                </View>
            )}
            {state.status === 'done' && Platform.OS === 'web' && (
                <ScrollView style={common.flex1} contentContainerStyle={styles.content}>
                    {blocks.length ? blocks.map((item, index) => renderBlock({ item, index })) : empty}
                    {credit}
                </ScrollView>
            )}
            {state.status === 'done' && Platform.OS !== 'web' && (
                <FlatList
                    ref={listRef}
                    style={common.flex1}
                    contentContainerStyle={styles.content}
                    data={blocks}
                    keyExtractor={item => `${item.from}-${item.to}`}
                    renderItem={renderBlock}
                    initialNumToRender={4}
                    windowSize={7}
                    onScrollToIndexFailed={({ index, averageItemLength }) => {
                        if (scrollAttempts.current++ >= 10) return;
                        listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
                        setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 100);
                    }}
                    ListEmptyComponent={empty}
                    ListFooterComponent={credit}
                />
            )}
        </SafeAreaView>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    pickers: {
        gap: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    sourcePicker: {
        flex: 3,
    },
    surahPicker: {
        flex: 2,
    },
    content: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
    },
    block: {
        ...common.card,
        padding: SPACING.md,
        marginTop: SPACING.sm,
        borderLeftWidth: 4,
        borderLeftColor: theme.border,
    },
    blockTarget: {
        borderLeftColor: theme.primary,
    },
    blockVerses: {
        alignSelf: 'flex-start',
        gap: 2,
        marginBottom: SPACING.sm,
    },
    blockVersesText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '700',
        color: theme.primary,
    },
    body: {
        ...common.mealText,
    },
    credit: {
        textAlign: 'center',
        paddingVertical: SPACING.lg,
    },
});
