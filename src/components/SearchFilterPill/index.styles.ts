import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
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
});
