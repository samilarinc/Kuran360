import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    resultsHeader: {
        fontSize: FONT_SIZES.small,
        color: theme.secondary,
        marginBottom: SPACING.md,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
