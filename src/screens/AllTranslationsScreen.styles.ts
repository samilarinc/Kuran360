import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, FAVORITE_COLOR, FAVORITE_COLOR_DARK } from '../theme';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
    ...common,
    content: {
        flex: 1,
    },
    verseHeader: {
        backgroundColor: theme.cardBackground,
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    arabicText: {
        fontSize: FONT_SIZES.arabic,
        lineHeight: FONT_SIZES.arabic * 1.5,
        textAlign: 'right',
        color: theme.text,
        fontWeight: '600',
        writingDirection: 'rtl',
        marginBottom: SPACING.sm,
    },
    verseInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    surahInfo: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    translationsContainer: {
        flex: 1,
    },
    translationItem: {
        ...common.card,
        marginHorizontal: SPACING.md,
        marginTop: SPACING.xs,
        marginBottom: SPACING.xs,
        padding: SPACING.md,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
        shadowRadius: 2,
    },
    favoriteTranslationItem: {
        backgroundColor: FAVORITE_COLOR + '10',
        borderLeftColor: FAVORITE_COLOR,
    },
    translationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    translationName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.primary,
        flex: 1,
    },
    favoriteTranslationName: {
        color: FAVORITE_COLOR_DARK,
        fontWeight: '700',
    },
    translationText: {
        fontSize: FONT_SIZES.medium,
        lineHeight: FONT_SIZES.medium * 1.4,
        color: theme.text,
        textAlign: 'left',
    },
    favoriteTranslationText: {
        fontWeight: '500',
    },
    emptyStateText: {
        ...common.emptyStateText,
        fontStyle: 'normal',
    },
    });
};
