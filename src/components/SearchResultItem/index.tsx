import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Type, PenLine, BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { Badge } from '@/components/Badge';
import { getSurahName } from '@/utils/surahName';
import { formatVerseNumber, VerseNumberStyle } from '@/utils/numerals';
import { Verse, Surah } from '@/types';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export interface SearchResult {
    verse: Verse;
    surah: Surah;
    matchedText: string;
    matchedField: 'arabic' | 'translation' | 'transliteration';
    matchedRange?: { start: number; end: number };
    translationName?: string;
    /** Optional tag next to the verse reference, e.g. how strong a topic match is. */
    badge?: { label: string; color: string };
}

interface SearchResultItemProps {
    result: SearchResult;
    verseNumberStyle: VerseNumberStyle;
    onPress: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, verseNumberStyle, onPress }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);

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
                <View style={[common.row, common.gapSm]}>
                    <Text style={styles.resultSurahInfo}>
                        {t('searchScreen.resultVerse', { surahName: getSurahName(t, result.surah), verseNumber: formatVerseNumber(result.verse.number, verseNumberStyle) })}
                    </Text>
                    {result.badge && <Badge label={result.badge.label} color={result.badge.color} variant="tint" size="small" />}
                </View>
                <View style={[common.row, common.gapXs]}>
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

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
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
            ...common.badgeText,
            color: theme.primary,
        },
        resultMatchType: {
            ...common.smallText,
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
            ...common.text,
            lineHeight: FONT_SIZES.medium * 1.5,
        },
        highlightedText: {
            fontWeight: 'bold',
            backgroundColor: '#FFD700',
            color: '#000000',
            borderRadius: 2,
            paddingHorizontal: 2,
        },
    });
};
