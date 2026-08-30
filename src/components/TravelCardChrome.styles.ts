import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    plannerCard: {
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SPACING.lg,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    plannerTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
        color: theme.text,
    },
    plannerActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    plannerActionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary,
    },
    plannerActionBtnTall: {
        minHeight: 44,
    },
    plannerActionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.primary,
    },
});
