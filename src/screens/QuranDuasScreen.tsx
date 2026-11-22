import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Tags, Users } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { DownloadRequired } from '@/components/DownloadRequired';
import { LoadingView } from '@/components/LoadingView';
import { Verse } from '@/components/Verse';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { loadSurah } from '@/data/quranData';
import { DUA_PEOPLE, DUA_PROPHETS, DUA_TOPICS, DuaPerson, duaVerseNumbers, QURAN_DUAS, QuranDua } from '@/data/quranDuas';
import { SPACING } from '@/theme';
import { useDownloadData } from '@/hooks/useDownloadData';
import { Verse as VerseType } from '@/types';
import { getSurahNameByNumber } from '@/utils/surahName';
import { createStyles } from './QuranDuasScreen.styles';

type Mode = 'order' | 'people' | 'topics';
const MODES: Mode[] = ['order', 'people', 'topics'];

interface Group {
    id: string;
    title: string;
    duas: QuranDua[];
}

type Row =
    | { kind: 'section'; key: string; title: string; count: number }
    | { kind: 'dua'; key: string; dua: QuranDua };

interface QuranDuasScreenProps {
    navigation: any;
    isDataAvailable: boolean;
}

/** Every dua in the Quran as verse cards, in mushaf order or grouped by who made it or by its topic. */
export const QuranDuasScreen: React.FC<QuranDuasScreenProps> = ({ navigation, isDataAvailable }) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { t } = useTranslation();
    const download = useDownloadData({ isDataAvailable });
    const listRef = useRef<FlatList<Row>>(null);

    const [verses, setVerses] = useState<Record<string, VerseType[]>>({});
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<Mode>('order');
    // The person or topic picked in the grouped modes; null shows every group
    const [category, setCategory] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);

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

    // Only the people and topics that have a dua
    const groups = useMemo<Group[]>(() => {
        const all: Group[] =
            mode === 'people' ? DUA_PEOPLE.map(p => ({ id: p, title: t(`quranDuas.people.${p}`), duas: QURAN_DUAS.filter(d => d.who === p) }))
            : mode === 'topics' ? DUA_TOPICS.map(p => ({ id: p, title: t(`quranDuas.topics.${p}`), duas: QURAN_DUAS.filter(d => d.topics.includes(p)) }))
            : [];
        return all.filter(g => g.duas.length > 0);
    }, [mode, t]);

    const rows = useMemo<Row[]>(() => {
        if (mode === 'order') return QURAN_DUAS.map(dua => ({ kind: 'dua', key: dua.id, dua }));
        // One person or topic picked: the picker already names it, so no section heading
        if (category !== null) {
            return (groups.find(g => g.id === category)?.duas ?? []).map(dua => ({ kind: 'dua', key: dua.id, dua }));
        }
        return groups.flatMap(g => [
            { kind: 'section' as const, key: `section-${g.id}`, title: g.title, count: g.duas.length },
            // The same dua can be in several topics, so keys carry the group
            ...g.duas.map(dua => ({ kind: 'dua' as const, key: `${g.id}-${dua.id}`, dua })),
        ]);
    }, [mode, groups, category]);

    const scrollToTop = () => listRef.current?.scrollToOffset({ offset: 0, animated: false });

    const changeMode = (next: Mode) => {
        if (next === mode) return;
        setMode(next);
        setCategory(null);
        scrollToTop();
    };

    const pickCategory = (next: string | null) => {
        setPickerOpen(false);
        if (next === category) return;
        setCategory(next);
        scrollToTop();
    };

    const selectedGroup = category === null ? undefined : groups.find(g => g.id === category);
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
                <>
                    <View style={styles.filters}>
                        <View style={common.segmented} accessibilityRole="tablist">
                            {MODES.map(m => {
                                const active = mode === m;
                                return (
                                    <TouchableOpacity
                                        key={m}
                                        style={[common.segment, active && common.segmentActive]}
                                        onPress={() => changeMode(m)}
                                        activeOpacity={0.8}
                                        accessibilityRole="tab"
                                        accessibilityState={{ selected: active }}
                                    >
                                        <Text style={[common.segmentText, active && common.segmentTextActive]} numberOfLines={1}>
                                            {t(`quranDuas.modes.${m}`)}
                                        </Text>
                                        {active && <View style={common.segmentGilding} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {mode === 'order' ? (
                            <Text style={styles.orderNote}>{t('quranDuas.orderNote', { duas: QURAN_DUAS.length, verses: verseCount })}</Text>
                        ) : (
                            <TouchableOpacity
                                style={styles.picker}
                                onPress={() => setPickerOpen(true)}
                                activeOpacity={0.75}
                                accessibilityRole="button"
                                accessibilityHint={t(mode === 'people' ? 'quranDuas.pickPerson' : 'quranDuas.pickTopic')}
                            >
                                <View style={styles.pickerIcon}>
                                    {mode === 'people'
                                        ? <Users size={18} color={theme.featuredIcon} />
                                        : <Tags size={18} color={theme.featuredIcon} />}
                                </View>
                                <Text style={styles.pickerValue} numberOfLines={1}>
                                    {selectedGroup?.title ?? t(mode === 'people' ? 'quranDuas.allPeople' : 'quranDuas.allTopics')}
                                </Text>
                                <Text style={styles.pickerCount}>
                                    {t('quranDuas.duaCount', { count: selectedGroup?.duas.length ?? QURAN_DUAS.length })}
                                </Text>
                                <ChevronDown size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        ref={listRef}
                        data={rows}
                        keyExtractor={row => row.key}
                        contentContainerStyle={styles.list}
                        initialNumToRender={6}
                        windowSize={7}
                        renderItem={({ item }) =>
                            item.kind === 'section' ? (
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle} numberOfLines={1}>{item.title}</Text>
                                    <View style={styles.sectionRule} />
                                    <Text style={styles.sectionCount}>{t('quranDuas.duaCount', { count: item.count })}</Text>
                                </View>
                            ) : (
                                <DuaBlock dua={item.dua} verses={verses[item.dua.id] ?? []} showWho={mode !== 'people'} navigation={navigation} />
                            )
                        }
                    />

                    <GroupSheet
                        visible={pickerOpen && mode !== 'order'}
                        mode={mode}
                        groups={groups}
                        selected={category}
                        onSelect={pickCategory}
                        onClose={() => setPickerOpen(false)}
                    />
                </>
            )}
        </SafeAreaView>
    );
};

/** The people or topics, slid up from the bottom; people are split into the prophets and everyone else. */
const GroupSheet: React.FC<{
    visible: boolean;
    mode: Mode;
    groups: Group[];
    selected: string | null;
    onSelect: (id: string | null) => void;
    onClose: () => void;
}> = ({ visible, mode, groups, selected, onSelect, onClose }) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const sections: { label?: string; groups: Group[] }[] = mode === 'people'
        ? [
            { label: t('quranDuas.prophets'), groups: groups.filter(g => DUA_PROPHETS.includes(g.id as DuaPerson)) },
            { label: t('quranDuas.othersGroup'), groups: groups.filter(g => !DUA_PROPHETS.includes(g.id as DuaPerson)) },
        ]
        : [{ groups }];

    const renderOption = (id: string | null, title: string, count: number) => {
        const isSelected = selected === id;
        return (
            <TouchableOpacity
                key={id ?? 'all'}
                style={[styles.sheetOption, isSelected && styles.sheetOptionSelected]}
                onPress={() => onSelect(id)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
            >
                <View style={[common.pickerRadio, isSelected && common.pickerRadioSelected]}>
                    {isSelected && <View style={common.pickerRadioDot} />}
                </View>
                <Text style={[styles.sheetOptionText, isSelected && styles.sheetOptionTextSelected]} numberOfLines={1}>{title}</Text>
                <Text style={styles.sheetOptionCount}>{count}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={common.sheetOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('quranDuas.close')} />
                <View style={[common.sheetContainer, { paddingBottom: SPACING.lg + insets.bottom }]}>
                    <View style={common.sheetHandle} />
                    <View style={[common.pickerHeader, styles.sheetHeader]}>
                        <Text style={common.pickerHeaderTitle}>{t(mode === 'people' ? 'quranDuas.pickPerson' : 'quranDuas.pickTopic')}</Text>
                        <TouchableOpacity onPress={onClose} style={common.pickerCloseButton} accessibilityLabel={t('quranDuas.close')}>
                            <Text style={common.pickerCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
                        {renderOption(null, t(mode === 'people' ? 'quranDuas.allPeople' : 'quranDuas.allTopics'), QURAN_DUAS.length)}
                        {sections.map((section, index) => (
                            <View key={section.label ?? index}>
                                {section.label && <Text style={styles.sheetGroupLabel}>{section.label}</Text>}
                                {section.groups.map(g => renderOption(g.id, g.title, g.duas.length))}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
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
