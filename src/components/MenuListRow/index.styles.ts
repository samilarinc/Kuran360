import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        // Outer row container — card variant (UmrahMenuScreen style)
        cardRow: {
            ...common.card,
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.lg,
            borderWidth: 1,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderColor: theme.border,
            backgroundColor: theme.cardBackground,
        },
        // Outer row container — list variant (MainScreen style)
        listRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.sm + 4,
            paddingHorizontal: SPACING.md,
        },

        // Icon container — card variant
        cardIconContainer: {
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
        },
        cardIcon: {
            fontSize: 32,
        },
        // Icon container — list variant
        listIconContainer: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
        },
        listIcon: {
            fontSize: 18,
        },

        // Text block — card variant
        cardTitle: {
            fontSize: FONT_SIZES.large,
            fontWeight: 'bold',
            marginBottom: SPACING.xs,
            color: theme.text,
        },
        cardSubtitle: {
            fontSize: FONT_SIZES.small,
            color: theme.textSecondary,
        },

        // Text block — list variant
        listTitle: {
            fontSize: FONT_SIZES.medium,
            fontWeight: '600',
            color: theme.text,
        },
        listSubtitle: {
            fontSize: FONT_SIZES.large,
            color: theme.primary,
            textAlign: 'right',
            marginBottom: SPACING.xs,
        },
        listCaption: {
            fontSize: FONT_SIZES.small,
            color: theme.textSecondary,
        },

        // Chevron — card variant
        cardArrowContainer: {
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
        },
        cardArrow: {
            fontSize: 32,
            color: theme.textSecondary,
        },
        // Chevron — list variant
        listChevron: {
            fontSize: FONT_SIZES.large,
            fontWeight: '300',
            marginLeft: SPACING.sm,
            color: theme.textSecondary,
        },
    });
};
