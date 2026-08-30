import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Type, PenLine, BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getSurahName } from '@/utils/surahName';
import { formatVerseNumber, VerseNumberStyle } from '@/utils/numerals';
import { Verse, Surah } from '@/types';
import { createStyles } from './index.styles';

export interface SearchResult {
    verse: Verse;
    surah: Surah;
    matchedText: string;
    matchedField: 'arabic' | 'translation' | 'transliteration';
    matchedRange?: { start: number; end: number };
    translationName?: string;
}

interface SearchResultItemProps {
    result: SearchResult;
    verseNumberStyle: VerseNumberStyle;
    onPress: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, verseNumberStyle, onPress }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const highlightMatch = (text: string, range?: { start: number; end: number }) => {
        if (!range || range.start >= range.end) {
            return <Text style={styles.resultText}>{text}</Text>;
        }

        const before = text.slice(0, range.start);
        const match = text.slice(range.start, range.end);
        const after = text.slice(range.end);

        return (
            <Text style={styles.resultText}>
                {before}
                <Text style={styles.highlightedText}>{match}</Text>
                {after}
            </Text>
        );
    };

    return (
        <TouchableOpacity style={styles.resultItem} onPress={onPress}>
            <View style={styles.resultHeader}>
                <Text style={styles.resultSurahInfo}>
                    {t('searchScreen.resultVerse', { surahName: getSurahName(t, result.surah), verseNumber: formatVerseNumber(result.verse.number, verseNumberStyle) })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {result.matchedField === 'arabic' ? (
                        <Type size={12} color={theme.secondary} />
                    ) : result.matchedField === 'transliteration' ? (
                        <PenLine size={12} color={theme.secondary} />
                    ) : (
                        <BookOpen size={12} color={theme.secondary} />
                    )}
                    <Text style={styles.resultMatchType}>
                        {result.matchedField === 'arabic' ? t('searchScreen.matchField.arabic') :
                            result.matchedField === 'transliteration' ? t('searchScreen.matchField.transliteration') :
                                t('searchScreen.matchField.translation', { translation: result.translationName || t('searchScreen.defaultTranslationLabel') })}
                    </Text>
                </View>
            </View>

            {result.matchedField === 'arabic' && (
                <Text style={styles.resultArabic}>
                    {result.verse.arabicText}
                </Text>
            )}

            {highlightMatch(result.matchedText, result.matchedRange)}
        </TouchableOpacity>
    );
};
