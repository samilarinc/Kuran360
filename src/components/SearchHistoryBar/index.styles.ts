import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
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
    });
};
