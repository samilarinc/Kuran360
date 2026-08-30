import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SafeAreaView, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useDebouncedSettings } from '@/hooks/useDebouncedSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/AppHeader';
import { DownloadRequired } from '@/components/DownloadRequired';
import { SearchInput } from '@/components/SearchInput';
import { SearchFiltersPanel } from '@/components/SearchFiltersPanel';
import { SearchScope } from '@/components/SearchScopeSelector';
import { SearchHistoryBar } from '@/components/SearchHistoryBar';
import { SearchResultsList } from '@/components/SearchResultsList';
import { SearchResult } from '@/components/SearchResultItem';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { quranData, loadSurah } from '@/data/quranData';
import { useDownloadData } from '@/hooks/useDownloadData';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './SearchScreen.styles';

interface SearchScreenProps {
    navigation: any;
    isDataAvailable: boolean;
}

type SurahFilter = 'all' | number;

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, isDataAvailable }) => {
    const { settings, availableTranslations } = useDebouncedSettings(300);
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);
    const navHelpers = useNavigationHelpers();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchScope, setSearchScope] = useState<SearchScope>('everywhere');
    const [selectedTranslation, setSelectedTranslation] = useState(settings.favoriteTranslation);
    const [surahFilter, setSurahFilter] = useState<SurahFilter>('all');
    const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
    const [showSpecificSurah, setShowSpecificSurah] = useState(false);
    const [showTranslationDropdown, setShowTranslationDropdown] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState(false);
    const [useFuzzySearch, setUseFuzzySearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const {
        downloading,
        downloadProgress,
        downloadStatus,
        downloadedBytes,
        totalBytes,
        handleDownloadData,
    } = useDownloadData({ isDataAvailable, navigation });

    // Search history cache key
    const SEARCH_HISTORY_KEY = 'quran_search_history';

    // Load search history on component mount
    useEffect(() => {
        const loadSearchHistory = async () => {
            try {
                const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
                if (history) {
                    setSearchHistory(JSON.parse(history));
                }
            } catch (error) {
                console.error('Error loading search history:', error);
            }
        };
        loadSearchHistory();
    }, []);

    // Save search to history
    const saveSearchToHistory = useCallback(async (query: string) => {
        if (!query.trim() || query.length < 2) return;

        try {
            const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10); // Keep last 10 searches
            setSearchHistory(newHistory);
            await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }, [searchHistory]);

    // Clear search history
    const clearSearchHistory = useCallback(async () => {
        try {
            setSearchHistory([]);
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (error) {
            console.error('Error clearing search history:', error);
        }
    }, []);

    const normalizeForSearch = useCallback((input: string) => {
        const punctuationRegex = /[.,;:!?"'(){}[\]<>/\\|@#$%^&*_+=~`-]/;
        const map: Record<string, string> = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'c', 'Ğ': 'g', 'I': 'i', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
        };

        const normalizedChars: string[] = [];
        const indexMap: number[] = [];

        for (let i = 0; i < input.length; i += 1) {
            const lower = input[i].toLocaleLowerCase('tr');
            const replaced = map[lower] || lower;
            const outputChar = punctuationRegex.test(replaced) ? ' ' : replaced;
            normalizedChars.push(outputChar);
            indexMap.push(i);
        }

        return { normalized: normalizedChars.join(''), indexMap };
    }, []);

    const normalizeQuery = useCallback((input: string) => {
        const { normalized } = normalizeForSearch(input);
        return normalized.replace(/\s+/g, ' ').trim();
    }, [normalizeForSearch]);

    const calculateSimilarity = useCallback((str1: string, str2: string): number => {
        if (str1.length === 0) return str2.length;
        if (str2.length === 0) return str1.length;

        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + cost
                );
            }
        }

        return matrix[str2.length][str1.length];
    }, []);

    const getMatchRange = useCallback((text: string, query: string) => {
        if (!text || !query.trim()) return null;

        const { normalized: normalizedText, indexMap } = normalizeForSearch(text);
        const normalizedQuery = normalizeQuery(query);

        if (!normalizedQuery) return null;

        const tokens = normalizedQuery.split(' ').filter(Boolean);
        const pattern = tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
        const regex = new RegExp(pattern, 'i');
        const directMatch = regex.exec(normalizedText);

        if (directMatch) {
            const start = directMatch.index;
            const end = start + directMatch[0].length;
            return { start: indexMap[start], end: indexMap[end - 1] + 1 };
        }

        if (!useFuzzySearch) {
            return null;
        }

        const maxDistance = Math.floor(normalizedQuery.length * 0.3);
        if (normalizedQuery.length < 4) {
            return null;
        }

        let bestMatch: { index: number; distance: number } | null = null;
        for (let i = 0; i <= normalizedText.length - normalizedQuery.length; i++) {
            const substring = normalizedText.substr(i, normalizedQuery.length);
            const distance = calculateSimilarity(normalizedQuery, substring);
            if (distance <= maxDistance && (!bestMatch || distance < bestMatch.distance)) {
                bestMatch = { index: i, distance };
                if (distance === 0) break;
            }
        }

        if (!bestMatch) {
            return null;
        }

        const start = bestMatch.index;
        const end = start + normalizedQuery.length;
        return { start: indexMap[start], end: indexMap[end - 1] + 1 };
    }, [calculateSimilarity, normalizeForSearch, normalizeQuery, useFuzzySearch]);

    // Debounced search
    useEffect(() => {
        if (!isDataAvailable) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            // Save to search history
            await saveSearchToHistory(searchQuery);

            setIsSearching(true);
            const results: SearchResult[] = [];

            try {
                const surahs = surahFilter === 'all'
                    ? quranData.surahs
                    : selectedSurah
                        ? quranData.surahs.filter(s => s.number === selectedSurah)
                        : quranData.surahs;

                for (const surahData of surahs) {
                    if (!surahData) continue;
                    const surah = await loadSurah(surahData.number);
                    if (!surah) continue;

                    for (const verse of surah.verses) {
                        // Search in Arabic text
                        const arabicMatchRange = (searchScope === 'everywhere' || searchScope === 'arabic')
                            ? getMatchRange(verse.arabicText, searchQuery)
                            : null;
                        if (arabicMatchRange) {
                            results.push({
                                verse,
                                surah,
                                matchedText: verse.arabicText,
                                matchedField: 'arabic',
                                matchedRange: arabicMatchRange,
                            });
                            continue;
                        }

                        // Search in transliteration
                        const transliterationMatchRange = (searchScope === 'everywhere' || searchScope === 'transliteration')
                            ? getMatchRange(verse.transliteration || '', searchQuery)
                            : null;
                        if (verse.transliteration && transliterationMatchRange) {
                            results.push({
                                verse,
                                surah,
                                matchedText: verse.transliteration,
                                matchedField: 'transliteration',
                                matchedRange: transliterationMatchRange,
                            });
                            continue;
                        }

                        // Search in translations
                        if (verse.allTranslations && searchScope !== 'arabic' && searchScope !== 'transliteration') {
                            let translationsToSearch: string[] = [];

                            switch (searchScope) {
                                case 'everywhere':
                                    translationsToSearch = settings.selectedTranslations;
                                    break;
                                case 'favorite':
                                    translationsToSearch = [settings.favoriteTranslation];
                                    break;
                                case 'selected':
                                    translationsToSearch = [selectedTranslation];
                                    break;
                                case 'all-translations':
                                    translationsToSearch = Object.keys(verse.allTranslations);
                                    break;
                            }

                            for (const translationName of translationsToSearch) {
                                const translationText = verse.allTranslations[translationName];
                                const translationMatchRange = translationText
                                    ? getMatchRange(translationText, searchQuery)
                                    : null;
                                if (translationText && translationMatchRange) {
                                    results.push({
                                        verse,
                                        surah,
                                        matchedText: translationText,
                                        matchedField: 'translation',
                                        matchedRange: translationMatchRange,
                                        translationName
                                    });
                                    break; // Don't add same verse multiple times for different translations
                                }
                            }
                        }
                    }
                }

                setSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
                Alert.alert(t('searchScreen.searchErrorTitle'), t('searchScreen.searchErrorMessage'));
            } finally {
                setIsSearching(false);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
        // saveSearchToHistory is intentionally excluded: its identity changes with searchHistory,
        // and including it would re-trigger this search effect right after it saves a history entry.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, searchScope, selectedTranslation, surahFilter, selectedSurah, useFuzzySearch, isDataAvailable, getMatchRange, settings.favoriteTranslation, settings.selectedTranslations, t]);

    if (!isDataAvailable) {
        return (
            <SafeAreaView style={common.container}>
                <AppHeader
                    title={t('searchScreen.title')}
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                    showHomeButton={true}
                    onHomePress={() => navigation.navigate('Main')}
                />
                <DownloadRequired
                    title={t('searchScreen.downloadTitle')}
                    description={t('searchScreen.downloadDescription')}
                    totalBytes={totalBytes}
                    downloading={downloading}
                    downloadProgress={downloadProgress}
                    downloadStatus={downloadStatus}
                    downloadedBytes={downloadedBytes}
                    onDownloadPress={handleDownloadData}
                />
            </SafeAreaView>
        );
    }

    const handleResultPress = (result: SearchResult) => {
        // Verse number'ı 0-based index'e çevir (verse.number 1-based)
        const verseIndex = result.verse.number - 1;
        navHelpers.goToSurahVerse(result.surah.number, verseIndex);
    };

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('searchScreen.title')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContentPadding}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
            >
                <SearchInput
                    style={styles.searchContainer}
                    inputStyle={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t('searchScreen.placeholder')}
                    placeholderColor={theme.secondary}
                    returnKeyType="search"
                    autoFocus={true}
                    loading={isSearching}
                    onFocus={() => setShowHistory(true)}
                    onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                />

                <SearchHistoryBar
                    visible={showHistory}
                    history={searchHistory}
                    onSelect={(query) => {
                        setSearchQuery(query);
                        setShowHistory(false);
                    }}
                    onClear={clearSearchHistory}
                />

                <SearchFiltersPanel
                    expanded={expandedFilters}
                    onToggleExpanded={() => setExpandedFilters(!expandedFilters)}
                    searchScope={searchScope}
                    onChangeScope={setSearchScope}
                    selectedTranslation={selectedTranslation}
                    availableTranslations={availableTranslations}
                    showTranslationDropdown={showTranslationDropdown}
                    onToggleTranslationDropdown={() => setShowTranslationDropdown(!showTranslationDropdown)}
                    onSelectTranslation={(translation) => {
                        setSelectedTranslation(translation);
                        setShowTranslationDropdown(false);
                    }}
                    surahs={quranData.surahs}
                    surahFilter={surahFilter}
                    selectedSurah={selectedSurah}
                    showSpecificSurah={showSpecificSurah}
                    onSelectAllSurahs={() => {
                        setSurahFilter('all');
                        setShowSpecificSurah(false);
                        setSelectedSurah(null);
                    }}
                    onToggleSpecificSurah={() => {
                        setSurahFilter(selectedSurah || 1);
                        setShowSpecificSurah(!showSpecificSurah);
                    }}
                    onSelectSurah={(surahNumber) => {
                        setSelectedSurah(surahNumber);
                        setSurahFilter(surahNumber);
                        setShowSpecificSurah(false);
                    }}
                    useFuzzySearch={useFuzzySearch}
                    onChangeFuzzySearch={setUseFuzzySearch}
                />

                <SearchResultsList
                    query={searchQuery}
                    results={searchResults}
                    verseNumberStyle={settings.verseNumberStyle}
                    onResultPress={handleResultPress}
                />
            </ScrollView>
        </SafeAreaView>
    );
};
