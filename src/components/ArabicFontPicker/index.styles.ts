import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    fontChip: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.surface,
        minWidth: 110,
        height: 72,
    },
    fontChipLabel: {
        fontSize: 10,
        color: theme.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },
    fontChipArabic: {
        fontSize: FONT_SIZES.large + 2,
        color: theme.text,
    },
});
