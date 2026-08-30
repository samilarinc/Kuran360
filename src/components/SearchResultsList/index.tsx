import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { VerseNumberStyle } from '@/utils/numerals';
import { SearchResultItem, SearchResult } from '@/components/SearchResultItem';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    return (
        <View style={common.flex1}>
            <Text style={styles.resultsHeader}>
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
