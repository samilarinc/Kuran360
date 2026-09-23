import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { VerseNumberStyle } from '@/utils/numerals';
import { SearchResultItem, SearchResult } from '@/components/SearchResultItem';

interface SearchResultsListProps {
    query: string;
    results: SearchResult[];
    verseNumberStyle: VerseNumberStyle;
    onResultPress: (result: SearchResult) => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
    query,
    results,
    verseNumberStyle,
    onResultPress,
}) => {
    const { common, theme } = useTheme();
    const { t } = useTranslation();

    return (
        <View style={common.flex1}>
            <Text style={[common.footerText, common.mbMd, { color: theme.secondary }]}>
                {query.length >= 2 ? t('searchScreen.resultsCount', { count: results.length }) : t('searchScreen.resultsMinChars')}
            </Text>

            <View>
                {results.map((result, index) => (
                    <SearchResultItem
                        key={`${result.surah.number}-${result.verse.number}-${index}`}
                        result={result}
                        verseNumberStyle={verseNumberStyle}
                        onPress={() => onResultPress(result)}
                    />
                ))}
            </View>
        </View>
    );
};
