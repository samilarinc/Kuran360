import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { LoadingView } from '@/components/LoadingView';
import { DownloadRequired } from '@/components/DownloadRequired';
import { SearchResult, SearchResultItem } from '@/components/SearchResultItem';
import { quranData, loadSurah } from '@/data/quranData';
import { formatRoot } from '@/utils/arabicText';
import { useDownloadData } from '@/hooks/useDownloadData';

interface RootVersesScreenProps {
    navigation: any;
    root: string;
    isDataAvailable: boolean;
}

const PAGE_SIZE = 50;

/** Every verse that has a word from the given Arabic root, with those words highlighted. */
export const RootVersesScreen: React.FC<RootVersesScreenProps> = ({ navigation, root, isDataAvailable }) => {
    const { settings } = useSettings();
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const { goToSurahVerse } = useNavigationHelpers();

    const [results, setResults] = useState<SearchResult[]>([]);
    const [wordCount, setWordCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const download = useDownloadData({ isDataAvailable, navigation });

    useEffect(() => {
        if (!isDataAvailable) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setVisibleCount(PAGE_SIZE);

        const findVerses = async () => {
            const found: SearchResult[] = [];
            let words = 0;
            for (const surahMeta of quranData.surahs) {
                const surah = await loadSurah(surahMeta.number);
                if (cancelled) return;
                if (!surah) continue;
                for (const verse of surah.verses) {
                    const matches = verse.wordTranslations.filter(word => word.root === root).length;
                    if (matches === 0) continue;
                    words += matches;
                    found.push({
                        verse,
                        surah,
                        matchedText: verse.allTranslations?.[settings.favoriteTranslation] || verse.translation,
                        matchedField: 'translation',
                        translationName: settings.favoriteTranslation,
                        highlightRoot: root,
                    });
                }
            }
            setResults(found);
            setWordCount(words);
            setLoading(false);
        };
        findVerses();

        return () => { cancelled = true; };
    }, [root, isDataAvailable, settings.favoriteTranslation]);

    const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('rootVerses.title', { root: formatRoot(root) })}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            {!isDataAvailable ? (
                <DownloadRequired
                    title={t('rootVerses.downloadTitle')}
                    description={t('rootVerses.downloadDescription')}
                    totalBytes={download.totalBytes}
                    downloading={download.downloading}
                    downloadProgress={download.downloadProgress}
                    downloadStatus={download.downloadStatus}
                    downloadedBytes={download.downloadedBytes}
                    onDownloadPress={download.handleDownloadData}
                />
            ) : loading ? (
                <LoadingView text={t('rootVerses.loading')} />
            ) : (
                <ScrollView
                    style={common.contentLarge}
                    contentContainerStyle={common.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[common.footerText, common.mbMd, { color: theme.secondary }]}>
                        {t('rootVerses.summary', { verses: results.length, words: wordCount })}
                    </Text>

                    <View>
                        {visibleResults.map(result => (
                            <SearchResultItem
                                key={`${result.surah.number}-${result.verse.number}`}
                                result={result}
                                verseNumberStyle={settings.verseNumberStyle}
                                onPress={() => goToSurahVerse(result.surah.number, result.verse.number - 1)}
                            />
                        ))}
                    </View>

                    {visibleCount < results.length && (
                        <AppButton
                            title={t('rootVerses.showMore', { count: Math.min(PAGE_SIZE, results.length - visibleCount) })}
                            variant="outline"
                            onPress={() => setVisibleCount(count => count + PAGE_SIZE)}
                        />
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};
