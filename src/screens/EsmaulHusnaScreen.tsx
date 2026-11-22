import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated, BackHandler, FlatList, NativeScrollEvent, NativeSyntheticEvent, Platform, SafeAreaView, ScrollView, Text,
    TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ArabicText } from '@/components/ArabicText';
import { SearchInput } from '@/components/SearchInput';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { DIVINE_NAMES, DivineName } from '@/data/esmaulHusna';
import { ATTRIBUTE_GROUPS, DIVINE_ATTRIBUTES } from '@/data/divineAttributes';
import { SPACING } from '@/theme';
import { getSurahNameByNumber } from '@/utils/surahName';
import { matchesSearch } from '@/utils/searchFold';
import { CONTENT_MAX_WIDTH, createStyles, GRID_GAP } from './EsmaulHusnaScreen.styles';

type Tab = 'names' | 'attributes';

/** One page of the plaque viewer: a name or an attribute. */
interface Plaque {
    key: string;
    arabic: string;
    title: string;
    body: string;
    caption: string;
    verse?: { surah: number; verse: number };
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Arabic longer than this (two-word attributes, Zü'l-celâli ve'l-ikrâm) is set smaller on the plaque
const LONG_ARABIC = 14;

/** The same name all day, a different one each day, cycling through the 99. */
const nameOfDayIndex = () => {
    const now = new Date();
    const localDays = Math.floor((now.getTime() - now.getTimezoneOffset() * 60 * 1000) / DAY_MS);
    return localDays % DIVINE_NAMES.length;
};

const useGridColumns = () => {
    const { width } = useWindowDimensions();
    const content = Math.min(width, CONTENT_MAX_WIDTH) - 2 * SPACING.lg;
    const columns = content < 480 ? 3 : content < 640 ? 4 : 5;
    return { columns, tileWidth: (content - GRID_GAP * (columns - 1)) / columns };
};

interface EsmaulHusnaScreenProps {
    navigation: any;
}

/** The 99 names of Allah as a wall of calligraphy plaques, and His attributes grouped as in the ilmihal. */
export const EsmaulHusnaScreen: React.FC<EsmaulHusnaScreenProps> = ({ navigation }) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { t, i18n } = useTranslation();
    const { goToSurahVerse } = useNavigationHelpers();
    const [tab, setTab] = useState<Tab>('names');
    const [query, setQuery] = useState('');
    const [viewer, setViewer] = useState<{ items: Plaque[]; index: number } | null>(null);
    const { columns, tileWidth } = useGridColumns();
    const dayIndex = useMemo(nameOfDayIndex, []);

    const nameOf = (item: DivineName) => t(`esmaulHusna.names.${item.number}.name`);
    const meaningOf = (item: DivineName) => t(`esmaulHusna.names.${item.number}.meaning`);
    const verseLabel = (verse: { surah: number; verse: number }) =>
        t('esmaulHusna.verseRef', { surah: getSurahNameByNumber(t, verse.surah), verse: verse.verse });

    const namePlaques: Plaque[] = useMemo(
        () => DIVINE_NAMES.map(item => ({
            key: `n${item.number}`,
            arabic: item.arabic,
            title: nameOf(item),
            body: meaningOf(item),
            caption: t('esmaulHusna.counter', { number: item.number, total: DIVINE_NAMES.length }),
        })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [i18n.language],
    );

    const attributePlaques: Plaque[] = useMemo(
        () => DIVINE_ATTRIBUTES.map(item => ({
            key: item.id,
            arabic: item.arabic,
            title: t(`esmaulHusna.attributes.items.${item.id}.name`),
            body: t(`esmaulHusna.attributes.items.${item.id}.meaning`),
            caption: t(`esmaulHusna.attributes.groups.${item.group}.title`),
            verse: item.verse,
        })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [i18n.language],
    );

    const results = useMemo(
        () => DIVINE_NAMES.filter(item =>
            matchesSearch(query, [String(item.number), item.arabic, nameOf(item), meaningOf(item)])),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [query, i18n.language],
    );

    const openVerse = (verse: { surah: number; verse: number }) => {
        setViewer(null);
        goToSurahVerse(verse.surah, verse.verse - 1);
    };

    const renderTile = ({ item }: { item: DivineName }) => (
        <TouchableOpacity
            style={[styles.tile, { width: tileWidth }]}
            onPress={() => setViewer({ items: namePlaques, index: item.number - 1 })}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={`${item.number}. ${nameOf(item)}, ${meaningOf(item)}`}
        >
            <Text style={styles.tileNumber}>{item.number}</Text>
            <ArabicText style={styles.tileArabic} numberOfLines={1}>{item.arabic}</ArabicText>
            <Text style={styles.tileName} numberOfLines={1}>{nameOf(item)}</Text>
        </TouchableOpacity>
    );

    const dayName = DIVINE_NAMES[dayIndex];
    const namesHeader = (
        <View style={styles.listHeader}>
            {!query && (
                <TouchableOpacity
                    style={styles.dayPlaque}
                    onPress={() => setViewer({ items: namePlaques, index: dayIndex })}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('esmaulHusna.nameOfDay')}: ${nameOf(dayName)}, ${meaningOf(dayName)}`}
                >
                    <View style={styles.frame}>
                        <Text style={styles.dayLabel}>{t('esmaulHusna.nameOfDay')}</Text>
                        <ArabicText style={styles.dayArabic}>{dayName.arabic}</ArabicText>
                        <Text style={styles.dayName}>{nameOf(dayName)}</Text>
                        <Text style={styles.dayMeaning}>{meaningOf(dayName)}</Text>
                    </View>
                </TouchableOpacity>
            )}
            <SearchInput
                value={query}
                onChangeText={setQuery}
                onClear={() => setQuery('')}
                placeholder={t('esmaulHusna.searchPlaceholder')}
                icon
                autoCorrect={false}
                autoCapitalize="none"
            />
        </View>
    );

    const renderAttributes = () => (
        <ScrollView contentContainerStyle={styles.listContent}>
            <View style={styles.listHeader}>
                <Text style={styles.intro}>{t('esmaulHusna.attributesIntro')}</Text>
            </View>
            {ATTRIBUTE_GROUPS.map(group => {
                const items = DIVINE_ATTRIBUTES.filter(a => a.group === group);
                return (
                    <View key={group}>
                        <Text style={styles.groupTitle} accessibilityRole="header">
                            {t(`esmaulHusna.attributes.groups.${group}.title`)}
                        </Text>
                        <Text style={styles.groupDescription}>{t(`esmaulHusna.attributes.groups.${group}.description`)}</Text>
                        <View style={styles.group}>
                            {items.map((item, i) => (
                                <React.Fragment key={item.id}>
                                    {i > 0 && <View style={styles.rowDivider} />}
                                    <TouchableOpacity
                                        style={styles.row}
                                        onPress={() => setViewer({
                                            items: attributePlaques,
                                            index: DIVINE_ATTRIBUTES.indexOf(item),
                                        })}
                                        activeOpacity={0.6}
                                        accessibilityRole="button"
                                    >
                                        <View style={styles.rowText}>
                                            <Text style={styles.rowName}>{t(`esmaulHusna.attributes.items.${item.id}.name`)}</Text>
                                            <Text style={styles.rowMeaning} numberOfLines={2}>
                                                {t(`esmaulHusna.attributes.items.${item.id}.meaning`)}
                                            </Text>
                                            <Text style={styles.rowVerse}>{verseLabel(item.verse)}</Text>
                                        </View>
                                        <ArabicText style={styles.rowArabic}>{item.arabic}</ArabicText>
                                    </TouchableOpacity>
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                );
            })}
            <Text style={styles.footer}>{t('esmaulHusna.attributesSource')}</Text>
        </ScrollView>
    );

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('esmaulHusna.title')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
            />
            <View style={styles.tabsWrap}>
                <View style={styles.tabs} accessibilityRole="tablist">
                    {(['names', 'attributes'] as const).map(id => (
                        <TouchableOpacity
                            key={id}
                            style={[styles.tab, tab === id && styles.tabSelected]}
                            onPress={() => setTab(id)}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: tab === id }}
                        >
                            <Text style={[styles.tabText, tab === id && styles.tabTextSelected]}>{t(`esmaulHusna.tabs.${id}`)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            {tab === 'names' ? (
                <FlatList
                    key={`grid-${columns}`}
                    data={results}
                    numColumns={columns}
                    keyExtractor={item => String(item.number)}
                    renderItem={renderTile}
                    columnWrapperStyle={styles.gridRow}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    ListHeaderComponent={namesHeader}
                    ListEmptyComponent={
                        <View style={common.emptyState}>
                            <Text style={common.emptyStateText}>{t('esmaulHusna.noResults')}</Text>
                        </View>
                    }
                    ListFooterComponent={results.length > 0 ? <Text style={styles.footer}>{t('esmaulHusna.source')}</Text> : null}
                />
            ) : renderAttributes()}
            {viewer && (
                <PlaqueViewer
                    items={viewer.items}
                    initialIndex={viewer.index}
                    onClose={() => setViewer(null)}
                    onOpenVerse={openVerse}
                    verseLabel={verseLabel}
                />
            )}
        </SafeAreaView>
    );
};

interface PlaqueViewerProps {
    items: Plaque[];
    initialIndex: number;
    onClose: () => void;
    onOpenVerse: (verse: { surah: number; verse: number }) => void;
    verseLabel: (verse: { surah: number; verse: number }) => string;
}

/** Full-screen calligraphy plaques on the deep green, swiped through sideways; fades in over the page. */
const PlaqueViewer: React.FC<PlaqueViewerProps> = ({ items, initialIndex, onClose, onOpenVerse, verseLabel }) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [width, setWidth] = useState(0);
    // Height of the paging area, so each page can center its plaque vertically
    const [pageHeight, setPageHeight] = useState(0);
    const [index, setIndex] = useState(initialIndex);
    const listRef = useRef<FlatList<Plaque>>(null);
    const appear = useRef(new Animated.Value(0)).current;
    const useNativeDriver = Platform.OS !== 'web';

    useEffect(() => {
        Animated.timing(appear, { toValue: 1, duration: 220, useNativeDriver }).start();
    }, [appear, useNativeDriver]);

    const close = useCallback(() => {
        Animated.timing(appear, { toValue: 0, duration: 160, useNativeDriver }).start(() => onClose());
    }, [appear, onClose, useNativeDriver]);

    const goTo = useCallback((next: number) => {
        const clamped = Math.max(0, Math.min(items.length - 1, next));
        setIndex(clamped);
        listRef.current?.scrollToIndex({ index: clamped, animated: true });
    }, [items.length]);

    // Android back closes the plaque instead of leaving the screen
    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            close();
            return true;
        });
        return () => sub.remove();
    }, [close]);

    // Keyboard on web: arrows move, Escape closes
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') goTo(index + 1);
            else if (e.key === 'ArrowLeft') goTo(index - 1);
        };
        const doc = (globalThis as any).document;
        doc?.addEventListener('keydown', onKey);
        return () => doc?.removeEventListener('keydown', onKey);
    }, [close, goTo, index]);

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!width) return;
        const page = Math.round(e.nativeEvent.contentOffset.x / width);
        if (page !== index && page >= 0 && page < items.length) setIndex(page);
    };

    const current = items[index];

    const renderPage = ({ item }: { item: Plaque }) => (
        <ScrollView style={{ width, height: pageHeight }} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
            <View style={styles.pageFrame}>
                <View style={styles.pageFrameInner}>
                    <ArabicText style={[styles.pageArabic, item.arabic.length > LONG_ARABIC && styles.pageArabicLong]}>
                        {item.arabic}
                    </ArabicText>
                    <Text style={styles.pageTitle}>{item.title}</Text>
                    <View style={styles.pageRule} />
                    <Text style={styles.pageBody}>{item.body}</Text>
                    {item.verse && (
                        <TouchableOpacity
                            style={styles.verseButton}
                            onPress={() => onOpenVerse(item.verse!)}
                            accessibilityRole="button"
                        >
                            <BookOpen size={16} color={theme.featuredIcon} />
                            <Text style={styles.verseButtonText}>{t('esmaulHusna.openVerse')}: {verseLabel(item.verse)}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    );

    return (
        <Animated.View
            style={[
                styles.viewer,
                {
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom + SPACING.md,
                    opacity: appear,
                    transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }],
                },
            ]}
            onLayout={e => setWidth(e.nativeEvent.layout.width)}
            accessibilityViewIsModal
        >
            <View style={styles.viewerTop}>
                <Text style={styles.viewerCaption}>{current?.caption}</Text>
                <TouchableOpacity style={styles.iconButton} onPress={close} accessibilityRole="button" accessibilityLabel={t('esmaulHusna.close')}>
                    <X size={24} color={theme.featuredMuted} />
                </TouchableOpacity>
            </View>
            <View style={common.flex1} onLayout={e => setPageHeight(e.nativeEvent.layout.height)}>
            {width > 0 && pageHeight > 0 && (
                <FlatList
                    ref={listRef}
                    style={{ flex: 1 }}
                    data={items}
                    keyExtractor={item => item.key}
                    renderItem={renderPage}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                    onScroll={onScroll}
                    scrollEventThrottle={32}
                    initialNumToRender={3}
                    windowSize={3}
                />
            )}
            </View>
            <View style={styles.viewerBottom}>
                <TouchableOpacity
                    style={[styles.navButton, index === 0 && { opacity: 0.35 }]}
                    onPress={() => goTo(index - 1)}
                    disabled={index === 0}
                    accessibilityRole="button"
                    accessibilityLabel={t('esmaulHusna.previous')}
                >
                    <ChevronLeft size={24} color={theme.featuredText} />
                </TouchableOpacity>
                <Text style={styles.navHint}>{t('esmaulHusna.swipeHint')}</Text>
                <TouchableOpacity
                    style={[styles.navButton, index === items.length - 1 && { opacity: 0.35 }]}
                    onPress={() => goTo(index + 1)}
                    disabled={index === items.length - 1}
                    accessibilityRole="button"
                    accessibilityLabel={t('esmaulHusna.next')}
                >
                    <ChevronRight size={24} color={theme.featuredText} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};
