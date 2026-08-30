import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (_theme: Theme) => StyleSheet.create({
    translationActions: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
    },
    secondaryActionButton: {
        borderWidth: 1.5,
    },
    translationsContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
});
