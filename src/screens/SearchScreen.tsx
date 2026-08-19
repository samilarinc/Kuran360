import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { getSurahName } from '../utils/surahName';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { DownloadRequired } from '../components/DownloadRequired';
import { useNavigationHelpers } from '../contexts/NavigationContext';
import { FONT_SIZES, SPACING } from '../constants';
import { Verse, Surah } from '../types';
import { quranData, loadSurah } from '../data/quranData';
import { useDownloadData } from '../hooks/useDownloadData';

interface SearchScreenProps {
    navigation: any;
    isDataAvailable: boolean;
}

interface SearchResult {
    verse: Verse;
    surah: Surah;
    matchedText: string;
    matchedField: 'arabic' | 'translation' | 'transliteration';
    matchedRange?: { start: number; end: number };
    translationName?: string;
}

type SearchScope = 'everywhere' | 'favorite' | 'selected' | 'all-translations' | 'arabic' | 'transliteration';
type SurahFilter = 'all' | number;

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation, isDataAvailable }) => {
    const { settings, availableTranslations } = useDebouncedSettings(300);
    const { theme } = useTheme();
    const { t } = useTranslation();
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
        const punctuationRegex = /[.,;:!?"'(){}\[\]<>/\\|@#$%^&*_+=~`-]/;
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

    // Search function
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
    }, [searchQuery, searchScope, selectedTranslation, surahFilter, selectedSurah, useFuzzySearch, isDataAvailable]);

    if (!isDataAvailable) {
        return (
            <SafeAreaView style={createStyles(theme).container}>
                <HeaderWithDarkModeToggle
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

    const renderSearchScopeSelector = () => (
        <View style={createStyles(theme).selectorContainer}>
            <Text style={createStyles(theme).selectorTitle}>{t('searchScreen.scope.title')}</Text>
            <View style={createStyles(theme).selectorGrid}>
                {[
                    { key: 'everywhere', label: t('searchScreen.scope.everywhere'), icon: '🌍' },
                    { key: 'favorite', label: t('searchScreen.scope.favorite'), icon: '⭐' },
                    { key: 'selected', label: t('searchScreen.scope.selected'), icon: '📖' },
                    { key: 'all-translations', label: t('searchScreen.scope.allTranslations'), icon: '📚' },
                    { key: 'arabic', label: t('searchScreen.scope.arabic'), icon: '🔤' },
                    { key: 'transliteration', label: t('searchScreen.scope.transliteration'), icon: '📝' },
                ].map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            createStyles(theme).selectorOption,
                            searchScope === option.key && createStyles(theme).selectorOptionSelected
                        ]}
                        onPress={() => setSearchScope(option.key as SearchScope)}
                    >
                        <Text style={createStyles(theme).selectorIcon}>{option.icon}</Text>
                        <Text style={[
                            createStyles(theme).selectorOptionText,
                            searchScope === option.key && createStyles(theme).selectorOptionTextSelected
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderTranslationSelector = () => {
        if (searchScope !== 'selected') return null;

        return (
            <View style={createStyles(theme).selectorContainer}>
                <Text style={createStyles(theme).selectorTitle}>{t('searchScreen.translationSelector.title')}</Text>
                <View style={createStyles(theme).selectorGrid}>
                    <TouchableOpacity
                        style={[
                            createStyles(theme).selectorOption,
                            createStyles(theme).selectorOptionSelected,
                        ]}
                        onPress={() => setShowTranslationDropdown(!showTranslationDropdown)}
                    >
                        <Text style={[
                            createStyles(theme).selectorOptionText,
                            createStyles(theme).selectorOptionTextSelected,
                        ]}>
                            {t('searchScreen.translationSelector.selected', {
                                translation: selectedTranslation ? `(${selectedTranslation.length > 20 ? selectedTranslation.substring(0, 20) + '...' : selectedTranslation})` : '',
                            })}
                        </Text>
                        <Text style={createStyles(theme).toggleIcon}>
                            {showTranslationDropdown ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showTranslationDropdown && (
                    <View style={createStyles(theme).surahDropdown}>
                        <ScrollView
                            style={{ maxHeight: 200 }}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={createStyles(theme).selectorGrid}>
                                {availableTranslations.map((translation) => (
                                    <TouchableOpacity
                                        key={translation}
                                        style={[
                                            createStyles(theme).selectorOption,
                                            selectedTranslation === translation && createStyles(theme).selectorOptionSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedTranslation(translation);
                                            setShowTranslationDropdown(false);
                                        }}
                                    >
                                        <Text style={[
                                            createStyles(theme).selectorOptionText,
                                            selectedTranslation === translation && createStyles(theme).selectorOptionTextSelected
                                        ]}>
                                            {translation.length > 15 ? translation.substring(0, 15) + '...' : translation}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    };

    const renderSurahFilter = () => (
        <View style={createStyles(theme).selectorContainer}>
            <Text style={createStyles(theme).selectorTitle}>{t('searchScreen.surahFilter.title')}</Text>
            <View style={createStyles(theme).selectorGrid}>
                <TouchableOpacity
                    style={[
                        createStyles(theme).selectorOption,
                        surahFilter === 'all' && createStyles(theme).selectorOptionSelected
                    ]}
                    onPress={() => {
                        setSurahFilter('all');
                        setShowSpecificSurah(false);
                        setSelectedSurah(null);
                    }}
                >
                    <Text style={[
                        createStyles(theme).selectorOptionText,
                        surahFilter === 'all' && createStyles(theme).selectorOptionTextSelected
                    ]}>
                        {t('searchScreen.surahFilter.all')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        createStyles(theme).selectorOption,
                        surahFilter !== 'all' && createStyles(theme).selectorOptionSelected
                    ]}
                    onPress={() => {
                        setSurahFilter(selectedSurah || 1);
                        setShowSpecificSurah(!showSpecificSurah);
                    }}
                >
                    <Text style={[
                        createStyles(theme).selectorOptionText,
                        surahFilter !== 'all' && createStyles(theme).selectorOptionTextSelected
                    ]}>
                        {t('searchScreen.surahFilter.selectedSurah')} {selectedSurah ? (() => {
                            const s = quranData.surahs.find(s => s.number === selectedSurah);
                            return s ? `(${selectedSurah}. ${getSurahName(t, s)})` : '';
                        })() : ''}
                    </Text>
                    <Text style={createStyles(theme).toggleIcon}>
                        {showSpecificSurah ? '▲' : '▼'}
                    </Text>
                </TouchableOpacity>
            </View>

            {showSpecificSurah && (
                <View style={createStyles(theme).surahDropdown}>
                    <ScrollView
                        style={{ maxHeight: 200 }}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={createStyles(theme).selectorGrid}>
                            {quranData.surahs.map((surah) => (
                                <TouchableOpacity
                                    key={surah.number}
                                    style={[
                                        createStyles(theme).selectorOption,
                                        selectedSurah === surah.number && createStyles(theme).selectorOptionSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedSurah(surah.number);
                                        setSurahFilter(surah.number);
                                        setShowSpecificSurah(false);
                                    }}
                                >
                                    <Text style={[
                                        createStyles(theme).selectorOptionText,
                                        selectedSurah === surah.number && createStyles(theme).selectorOptionTextSelected
                                    ]}>
                                        {surah.number}. {getSurahName(t, surah)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );

    const highlightMatch = (text: string, range?: { start: number; end: number }) => {
        if (!range || range.start >= range.end) {
            return <Text style={createStyles(theme).resultText}>{text}</Text>;
        }

        const before = text.slice(0, range.start);
        const match = text.slice(range.start, range.end);
        const after = text.slice(range.end);

        return (
            <Text style={createStyles(theme).resultText}>
                {before}
                <Text style={createStyles(theme).highlightedText}>{match}</Text>
                {after}
            </Text>
        );
    };

    const renderSearchResult = (result: SearchResult, index: number) => {
        const handleResultPress = () => {
            // Verse number'ı 0-based index'e çevir (verse.number 1-based)
            const verseIndex = result.verse.number - 1;
            navHelpers.goToSurahVerse(result.surah.number, verseIndex);
        };

        return (
            <TouchableOpacity
                key={`${result.surah.number}-${result.verse.number}-${index}`}
                style={createStyles(theme).resultItem}
                onPress={handleResultPress}
            >
                <View style={createStyles(theme).resultHeader}>
                    <Text style={createStyles(theme).resultSurahInfo}>
                        {t('searchScreen.resultVerse', { surahName: getSurahName(t, result.surah), verseNumber: result.verse.number })}
                    </Text>
                    <Text style={createStyles(theme).resultMatchType}>
                        {result.matchedField === 'arabic' ? t('searchScreen.matchField.arabic') :
                            result.matchedField === 'transliteration' ? t('searchScreen.matchField.transliteration') :
                                t('searchScreen.matchField.translation', { translation: result.translationName || t('searchScreen.defaultTranslationLabel') })}
                    </Text>
                </View>

                {result.matchedField === 'arabic' && (
                    <Text style={createStyles(theme).resultArabic}>
                        {result.verse.arabicText}
                    </Text>
                )}

                {highlightMatch(result.matchedText, result.matchedRange)}
            </TouchableOpacity>
        );
    };

    const renderSearchHistory = () => {
        if (!showHistory || searchHistory.length === 0) return null;

        return (
            <View style={createStyles(theme).historyContainer}>
                <View style={createStyles(theme).historyHeader}>
                    <Text style={createStyles(theme).historyTitle}>{t('searchScreen.history.title')}</Text>
                    <TouchableOpacity onPress={clearSearchHistory}>
                        <Text style={createStyles(theme).clearHistoryText}>{t('searchScreen.history.clear')}</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {searchHistory.map((historyItem, index) => (
                        <TouchableOpacity
                            key={index}
                            style={createStyles(theme).historyItem}
                            onPress={() => {
                                setSearchQuery(historyItem);
                                setShowHistory(false);
                            }}
                        >
                            <Text style={createStyles(theme).historyItemText}>
                                {historyItem}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    return (
        <SafeAreaView style={createStyles(theme).container}>
            <HeaderWithDarkModeToggle
                title={t('searchScreen.title')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView
                style={createStyles(theme).content}
                contentContainerStyle={{ padding: SPACING.lg }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
            >
                {/* Search Input */}
                <View style={createStyles(theme).searchContainer}>
                    <TextInput
                        style={createStyles(theme).searchInput}
                        placeholder={t('searchScreen.placeholder')}
                        placeholderTextColor={theme.secondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        autoFocus={true}
                        onFocus={() => setShowHistory(true)}
                        onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                    />
                    {isSearching && (
                        <ActivityIndicator
                            style={createStyles(theme).searchSpinner}
                            color={theme.primary}
                        />
                    )}
                </View>

                {/* Search History */}
                {renderSearchHistory()}

                {/* Filters */}
                <TouchableOpacity
                    style={createStyles(theme).filtersToggle}
                    onPress={() => setExpandedFilters(!expandedFilters)}
                >
                    <Text style={createStyles(theme).filtersToggleText}>
                        {t('searchScreen.filtersToggle')}
                    </Text>
                    <Text style={createStyles(theme).filtersToggleIcon}>
                        {expandedFilters ? '▲' : '▼'}
                    </Text>
                </TouchableOpacity>

                {expandedFilters && (
                    <View style={createStyles(theme).filtersContainer}>
                        {renderSearchScopeSelector()}
                        {renderTranslationSelector()}
                        {renderSurahFilter()}

                        {/* Fuzzy Search Toggle */}
                        <View style={createStyles(theme).selectorContainer}>
                            <Text style={createStyles(theme).selectorTitle}>{t('searchScreen.matchType.type')}</Text>
                            <View style={createStyles(theme).selectorGrid}>
                                <TouchableOpacity
                                    style={[
                                        createStyles(theme).selectorOption,
                                        !useFuzzySearch && createStyles(theme).selectorOptionSelected
                                    ]}
                                    onPress={() => setUseFuzzySearch(false)}
                                >
                                    <Text style={[
                                        createStyles(theme).selectorOptionText,
                                        !useFuzzySearch && createStyles(theme).selectorOptionTextSelected
                                    ]}>
                                        {t('searchScreen.matchType.exact')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        createStyles(theme).selectorOption,
                                        useFuzzySearch && createStyles(theme).selectorOptionSelected
                                    ]}
                                    onPress={() => setUseFuzzySearch(true)}
                                >
                                    <Text style={[
                                        createStyles(theme).selectorOptionText,
                                        useFuzzySearch && createStyles(theme).selectorOptionTextSelected
                                    ]}>
                                        {t('searchScreen.matchType.fuzzy')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Results */}
                <View style={createStyles(theme).resultsContainer}>
                    <Text style={createStyles(theme).resultsHeader}>
                        {searchQuery.length >= 2 ? t('searchScreen.resultsCount', { count: searchResults.length }) : t('searchScreen.resultsMinChars')}
                    </Text>

                    <View>
                        {searchResults.map(renderSearchResult)}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    searchInput: {
        flex: 1,
        height: 50,
        backgroundColor: theme.cardBackground,
        borderRadius: 25,
        paddingHorizontal: SPACING.lg,
        fontSize: FONT_SIZES.medium,
        color: theme.text,
        borderWidth: 2,
        borderColor: theme.border,
    },
    searchSpinner: {
        marginLeft: SPACING.sm,
    },
    filtersToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.md,
    },
    filtersToggleText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    filtersToggleIcon: {
        fontSize: FONT_SIZES.small,
        color: theme.secondary,
    },
    filtersContainer: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    selectorContainer: {
        marginBottom: SPACING.md,
    },
    filterToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    toggleIcon: {
        fontSize: FONT_SIZES.small,
        color: theme.secondary,
        fontWeight: '600',
    },
    selectorTitle: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.secondary,
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    selectorScroll: {
        flexDirection: 'row',
    },
    selectorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    selectorOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: SPACING.xs,
        minWidth: 80,
        justifyContent: 'center',
    },
    selectorOptionSelected: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    selectorIcon: {
        fontSize: 16,
        marginRight: SPACING.xs,
    },
    selectorOptionText: {
        fontSize: FONT_SIZES.small,
        color: theme.text,
        fontWeight: '500',
    },
    selectorOptionTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    resultsContainer: {
        flex: 1,
    },
    resultsHeader: {
        fontSize: FONT_SIZES.small,
        color: theme.secondary,
        marginBottom: SPACING.md,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    resultsList: {
        flex: 1,
    },
    resultItem: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    resultSurahInfo: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.primary,
    },
    resultMatchType: {
        fontSize: FONT_SIZES.small,
        color: theme.secondary,
        fontStyle: 'italic',
    },
    resultArabic: {
        fontSize: FONT_SIZES.arabic,
        color: theme.text,
        textAlign: 'right',
        marginBottom: SPACING.xs,
        fontFamily: 'Scheherazade New, Noto Naskh Arabic, serif',
        lineHeight: FONT_SIZES.arabic * 1.8,
    },
    resultText: {
        fontSize: FONT_SIZES.medium,
        color: theme.text,
        lineHeight: FONT_SIZES.medium * 1.5,
    },
    resultTextContainer: {
        // Container için herhangi bir özel stil gerekmiyor
    },
    highlightedText: {
        fontWeight: 'bold',
        backgroundColor: '#FFD700',
        color: '#000000',
        borderRadius: 2,
        paddingHorizontal: 2,
    },
    historyContainer: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: theme.border,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    historyTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    clearHistoryText: {
        fontSize: FONT_SIZES.small,
        color: theme.primary,
        fontWeight: '500',
    },
    historyItem: {
        backgroundColor: theme.background,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 20,
        marginRight: SPACING.xs,
        borderWidth: 1,
        borderColor: theme.border,
    },
    historyItemText: {
        fontSize: FONT_SIZES.small,
        color: theme.text,
    },
    surahDropdown: {
        backgroundColor: theme.cardBackground,
        borderRadius: 8,
        marginTop: SPACING.xs,
        borderWidth: 1,
        borderColor: theme.border,
        padding: SPACING.xs,
    },
});
