import { StyleSheet } from 'react-native';
import { Theme } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme as any);

    return StyleSheet.create({
    ...common,
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
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
        ...common.text,
        fontWeight: '600',
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
        ...common.sectionLabel,
        color: theme.secondary,
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
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
        ...common.text,
        fontWeight: '600',
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
    dropdownScroll: {
        maxHeight: 200,
    },
    scrollContentPadding: {
        padding: SPACING.lg,
    },
    });
};
