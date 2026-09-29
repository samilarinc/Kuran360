import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, Theme, useThemedStyles } from '@/contexts/ThemeContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { AppHeader } from '@/components/AppHeader';
import { DownloadRequired } from '@/components/DownloadRequired';
import { LoadingView } from '@/components/LoadingView';
import { ErrorView } from '@/components/ErrorView';
import { SearchInput } from '@/components/SearchInput';
import { SearchResultsList } from '@/components/SearchResultsList';
import { SearchResult } from '@/components/SearchResultItem';
import { loadSurah } from '@/data/quranData';
import { useDownloadData } from '@/hooks/useDownloadData';
import {
    downloadTopicModel,
    embeddingModel,
    isTopicModelDownloaded,
    prepareTopicSearch,
    searchTopics,
    TOPIC_MODEL_SIZE_MB,
} from '@/services/topicSearch';
import { MatchLevel } from '@/utils/topicSearch';
import { SPACING } from '@/theme';

interface TopicSearchScreenProps {
    navigation: any;
    isDataAvailable: boolean;
}

type ModelState =
    | { status: 'checking' }
    | { status: 'missing' }
    | { status: 'downloading'; progress: number }
    | { status: 'loading' }
    | { status: 'ready' }
    | { status: 'error'; message: string };

const SEARCH_DELAY_MS = 400;
const LEVEL_COLORS: Record<MatchLevel, string> = { strong: '#2E7D32', related: '#607D8B', keyword: '#3B82F6' };

export const TopicSearchScreen: React.FC<TopicSearchScreenProps> = ({ navigation, isDataAvailable }) => {
    const { settings } = useSettings();
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { goToSurahVerse } = useNavigationHelpers();
    const download = useDownloadData({ isDataAvailable, navigation });

    const [modelState, setModelState] = useState<ModelState>(() =>
        embeddingModel.ready ? { status: 'ready' } : { status: 'checking' },
    );
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const latestSearch = useRef(0);
    const downloadAbort = useRef<AbortController | null>(null);

    const loadModel = useCallback(async () => {
        if (!embeddingModel.ready) setModelState({ status: 'loading' });
        try {
            await Promise.all([embeddingModel.load(), prepareTopicSearch()]);
            setModelState({ status: 'ready' });
        } catch (error: any) {
            setModelState({ status: 'error', message: String(error?.message ?? error) });
        }
    }, []);

    useEffect(() => {
        if (!isDataAvailable) return;
        (async () => {
            if (embeddingModel.ready) return;
            if (await isTopicModelDownloaded()) loadModel();
            else setModelState({ status: 'missing' });
        })();
        return () => downloadAbort.current?.abort();
    }, [isDataAvailable, loadModel]);

    const handleDownloadModel = async () => {
        const controller = new AbortController();
        downloadAbort.current = controller;
        setModelState({ status: 'downloading', progress: 0 });
        try {
            await downloadTopicModel(fraction => setModelState({ status: 'downloading', progress: fraction * 100 }), controller.signal);
            await loadModel();
        } catch (error: any) {
            if (controller.signal.aborted) return;
            setModelState({ status: 'error', message: String(error?.message ?? error) });
        }
    };

    // Debounced search; a newer query makes older, slower ones drop their results
    useEffect(() => {
        if (modelState.status !== 'ready') return;
        const text = query.trim();
        if (text.length < 2) {
            latestSearch.current++;
            setResults([]);
            setSearching(false);
            setSearchError(null);
            return;
        }
        setSearching(true);
        const timeout = setTimeout(async () => {
            const searchId = ++latestSearch.current;
            try {
                const hits = await searchTopics(text);
                const found: SearchResult[] = [];
                for (const hit of hits) {
                    const surah = await loadSurah(hit.surahNumber);
                    const verse = surah?.verses.find(item => item.number === hit.verseNumber);
                    if (!surah || !verse) continue;
                    found.push({
                        verse,
                        surah,
                        matchedText: verse.allTranslations?.[settings.favoriteTranslation] ?? verse.translation,
                        matchedField: 'translation',
                        translationName: settings.favoriteTranslation,
                        badge: { label: t(`topicSearch.level.${hit.level}`), color: LEVEL_COLORS[hit.level] },
                    });
                }
                if (searchId !== latestSearch.current) return;
                setResults(found);
                setSearchError(null);
            } catch (error: any) {
                if (searchId !== latestSearch.current) return;
                setSearchError(String(error?.message ?? error));
            } finally {
                if (searchId === latestSearch.current) setSearching(false);
            }
        }, SEARCH_DELAY_MS);
        return () => clearTimeout(timeout);
    }, [query, modelState.status, settings.favoriteTranslation, t]);

    const header = (
        <AppHeader
            title={t('topicSearch.title')}
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
            showHomeButton={true}
            onHomePress={() => navigation.navigate('Main')}
        />
    );

    if (!isDataAvailable) {
        return (
            <SafeAreaView style={common.container}>
                {header}
                <DownloadRequired
                    title={t('searchScreen.downloadTitle')}
                    description={t('searchScreen.downloadDescription')}
                    totalBytes={download.totalBytes}
                    downloading={download.downloading}
                    downloadProgress={download.downloadProgress}
                    downloadStatus={download.downloadStatus}
                    downloadedBytes={download.downloadedBytes}
                    onDownloadPress={download.handleDownloadData}
                />
            </SafeAreaView>
        );
    }

    if (modelState.status === 'missing' || modelState.status === 'downloading') {
        const downloading = modelState.status === 'downloading';
        const progress = downloading ? modelState.progress : 0;
        const totalBytes = TOPIC_MODEL_SIZE_MB * 1024 * 1024;
        return (
            <SafeAreaView style={common.container}>
                {header}
                <DownloadRequired
                    title={t('topicSearch.downloadTitle')}
                    description={t('topicSearch.downloadDescription')}
                    totalBytes={totalBytes}
                    downloading={downloading}
                    downloadProgress={progress}
                    downloadStatus={t('download.downloading')}
                    downloadedBytes={(totalBytes * progress) / 100}
                    onDownloadPress={handleDownloadModel}
                    downloadButtonLabel={t('topicSearch.downloadButton')}
                />
            </SafeAreaView>
        );
    }

    if (modelState.status === 'error') {
        return (
            <SafeAreaView style={common.container}>
                {header}
                <ErrorView text={t('topicSearch.modelError', { message: modelState.message })} retryText={t('topicSearch.retry')} onRetry={loadModel} />
            </SafeAreaView>
        );
    }

    if (modelState.status !== 'ready') {
        return (
            <SafeAreaView style={common.container}>
                {header}
                <LoadingView text={t('topicSearch.loadingModel')} />
            </SafeAreaView>
        );
    }

    const hasQuery = query.trim().length >= 2;

    return (
        <SafeAreaView style={common.container}>
            {header}
            <ScrollView
                style={common.contentLarge}
                contentContainerStyle={common.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <SearchInput
                    style={styles.searchContainer}
                    inputStyle={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('topicSearch.placeholder')}
                    placeholderColor={theme.secondary}
                    returnKeyType="search"
                    autoFocus={true}
                    loading={searching}
                />

                {!hasQuery && <Text style={[common.footerText, { color: theme.secondary }]}>{t('topicSearch.hint')}</Text>}
                {searchError && <Text style={[common.footerText, { color: theme.error }]}>{t('topicSearch.searchError', { message: searchError })}</Text>}
                {hasQuery && !searching && !searchError && results.length === 0 && (
                    <Text style={[common.footerText, { color: theme.secondary }]}>{t('topicSearch.noResults')}</Text>
                )}
                {hasQuery && results.length > 0 && (
                    <>
                        <Text style={[common.footerText, styles.disclaimer, { color: theme.secondary }]}>{t('topicSearch.disclaimer')}</Text>
                        <SearchResultsList
                            query={query}
                            results={results}
                            verseNumberStyle={settings.verseNumberStyle}
                            onResultPress={result => goToSurahVerse(result.surah.number, result.verse.number - 1)}
                        />
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: Theme) =>
    StyleSheet.create({
        searchContainer: {
            backgroundColor: 'transparent',
            borderWidth: 0,
            paddingHorizontal: 0,
            marginBottom: SPACING.lg,
        },
        searchInput: {
            height: 50,
            backgroundColor: theme.cardBackground,
            borderRadius: 25,
            paddingHorizontal: SPACING.lg,
            borderWidth: 2,
            borderColor: theme.border,
        },
        disclaimer: {
            marginBottom: SPACING.md,
        },
    });
