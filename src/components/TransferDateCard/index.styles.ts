import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    transferDescriptionText: {
        color: theme.textSecondary,
        textAlign: 'left',
        marginBottom: SPACING.sm,
    },
});
