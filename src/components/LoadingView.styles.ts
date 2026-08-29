import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    text: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
    },
    note: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
    },
});
