import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => {
    return StyleSheet.create({
        updateButton: {
            backgroundColor: theme.primary + '10',
            borderRadius: 12,
            padding: SPACING.md,
            margin: SPACING.lg,
        },
    });
};
