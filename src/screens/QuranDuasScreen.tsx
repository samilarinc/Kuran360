import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { DownloadRequired } from '@/components/DownloadRequired';
import { LoadingView } from '@/components/LoadingView';
import { SearchFilterPill } from '@/components/SearchFilterPill';
import { Verse } from '@/components/Verse';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { loadSurah } from '@/data/quranData';
import { DUA_PEOPLE, DUA_TOPICS, duaVerseNumbers, QURAN_DUAS, QuranDua } from '@/data/quranDuas';
import { useDownloadData } from '@/hooks/useDownloadData';
import { Verse as VerseType } from '@/types';
import { getSurahNameByNumber } from '@/utils/surahName';
import { createStyles } from './QuranDuasScreen.styles';

type Mode = 'order' | 'people' | 'topics';
const MODES: Mode[] = ['order', 'people', 'topics'];

type Row =
    | { kind: 'section'; key: string; title: string }
    | { kind: 'dua'; key: string; dua: QuranDua };

interface QuranDuasScreenProps {
    navigation: any;
    isDataAvailable: boolean;
}

/** Every dua in the Quran as verse cards, in mushaf order or grouped by who made it or by its topic. */
export const QuranDuasScreen: React.FC<QuranDuasScreenProps> = ({ navigation, isDataAvailable }) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { t } = useTranslation();
    const download = useDownloadData({ isDataAvailable });

    const [verses, setVerses] = useState<Record<string, VerseType[]>>({});
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<Mode>('order');
    // The person or topic picked in the grouped modes; null shows every group
    const [category, setCategory] = useState<string | null>(null);

    useEffect(() => {
        if (!isDataAvailable) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            const found: Record<string, VerseType[]> = {};
            for (const surahNumber of [...new Set(QURAN_DUAS.map(d => d.surah))]) {
                const surah = await loadSurah(surahNumber);
                if (cancelled) return;
                if (!surah) continue;
                for (const dua of QURAN_DUAS.filter(d => d.surah === surahNumber)) {
                    found[dua.id] = duaVerseNumbers(dua)
                        .map(n => surah.verses.find(v => v.number === n))
                        .filter((v): v is VerseType => !!v);
                }
            }
            setVerses(found);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [isDataAvailable]);

    const groups = useMemo(() => {
        if (mode === 'people') return DUA_PEOPLE.map(p => ({ id: p, title: t(`quranDuas.people.${p}`), duas: QURAN_DUAS.filter(d => d.who === p) }));
        if (mode === 'topics') return DUA_TOPICS.map(p => ({ id: p, title: t(`quranDuas.topics.${p}`), duas: QURAN_DUAS.filter(d => d.topics.includes(p)) }));
        return [];
    }, [mode, t]);

    const rows = useMemo<Row[]>(() => {
        if (mode === 'order') return QURAN_DUAS.map(dua => ({ kind: 'dua', key: dua.id, dua }));
        return groups
            .filter(g => g.duas.length > 0 && (category === null || g.id === category))
            .flatMap(g => [
                { kind: 'section' as const, key: `section-${g.id}`, title: g.title },
                // The same dua can be in several topics, so keys carry the group
                ...g.duas.map(dua => ({ kind: 'dua' as const, key: `${g.id}-${dua.id}`, dua })),
            ]);
    }, [mode, groups, category]);

    const changeMode = (next: Mode) => {
        setMode(next);
        setCategory(null);
    };

    const verseCount = QURAN_DUAS.reduce((sum, d) => sum + duaVerseNumbers(d).length, 0);

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('quranDuas.title')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
            />

            {!isDataAvailable ? (
                <DownloadRequired
                    title={t('quranDuas.downloadTitle')}
                    description={t('quranDuas.downloadDescription')}
                    totalBytes={download.totalBytes}
                    downloading={download.downloading}
                    downloadProgress={download.downloadProgress}
                    downloadStatus={download.downloadStatus}
                    downloadedBytes={download.downloadedBytes}
                    onDownloadPress={download.handleDownloadData}
                />
            ) : loading ? (
                <LoadingView text={t('quranDuas.loading')} />
            ) : (
                <FlatList
                    data={rows}
                    keyExtractor={row => row.key}
                    contentContainerStyle={styles.list}
                    initialNumToRender={6}
                    windowSize={7}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.summary}>{t('quranDuas.summary', { duas: QURAN_DUAS.length, verses: verseCount })}</Text>
                            <View style={styles.modeRow}>
                                {MODES.map(m => (
                                    <SearchFilterPill key={m} label={t(`quranDuas.modes.${m}`)} selected={mode === m} onPress={() => changeMode(m)} />
                                ))}
                            </View>
                            {mode !== 'order' && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                                    <SearchFilterPill label={t('quranDuas.all')} selected={category === null} onPress={() => setCategory(null)} />
                                    {groups.filter(g => g.duas.length > 0).map(g => (
                                        <SearchFilterPill
                                            key={g.id}
                                            label={`${g.title} (${g.duas.length})`}
                                            selected={category === g.id}
                                            onPress={() => setCategory(g.id)}
                                        />
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    }
                    renderItem={({ item }) =>
                        item.kind === 'section' ? (
                            <Text style={styles.sectionTitle}>{item.title}</Text>
                        ) : (
                            <DuaBlock dua={item.dua} verses={verses[item.dua.id] ?? []} showWho={mode !== 'people'} navigation={navigation} />
                        )
                    }
                />
            )}
        </SafeAreaView>
    );
};

/** One dua: who made it (unless its section already says) and its context, then its verse cards. */
const DuaBlock: React.FC<{ dua: QuranDua; verses: VerseType[]; showWho: boolean; navigation: any }> = React.memo(({ dua, verses, showWho, navigation }) => {
    const styles = useThemedStyles(createStyles);
    const { t } = useTranslation();
    const { goToSurahVerse } = useNavigationHelpers();
    const { audioState, toggleVerse } = useGlobalAudio();
    const surahName = getSurahNameByNumber(t, dua.surah);
    const reference = dua.to ? `${surahName} ${dua.from}-${dua.to}` : `${surahName} ${dua.from}`;

    return (
        <View>
            <View style={styles.duaHeader}>
                <Text style={styles.duaWho}>{showWho ? `${t(`quranDuas.people.${dua.who}`)} · ${reference}` : reference}</Text>
                <Text style={styles.duaContext}>{t(`quranDuas.items.${dua.id}`)}</Text>
            </View>
            {verses.map(verse => (
                <TouchableOpacity
                    key={verse.id}
                    activeOpacity={0.85}
                    accessibilityHint={t('quranDuas.openHint')}
                    onPress={() => goToSurahVerse(verse.surahNumber, verse.number - 1)}
                >
                    <Verse
                        verse={verse}
                        isPlaying={audioState.isPlaying && audioState.currentVerse?.id === verse.id}
                        onPlayPress={toggleVerse}
                        showMemorization={false}
                        navigation={navigation}
                        label={t('quranDuas.verseLabel', { surah: surahName, verse: verse.number })}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
});
