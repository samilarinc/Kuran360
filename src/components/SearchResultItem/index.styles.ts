import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

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
