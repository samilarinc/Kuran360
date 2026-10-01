import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => {

    return StyleSheet.create({
        scrollContentContainer: {
            flexGrow: 1,
            padding: SPACING.md,
            paddingBottom: SPACING.xl,
        },
        bottomActions: {
            padding: SPACING.md,
            paddingBottom: SPACING.lg,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            backgroundColor: theme.surface,
        },
    });
};
