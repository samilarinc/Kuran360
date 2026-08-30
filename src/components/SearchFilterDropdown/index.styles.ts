import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
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
    selectorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
});
