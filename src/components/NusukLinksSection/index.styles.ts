import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    section: {
        marginBottom: SPACING.xl,
    },
    linkButton: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    linkButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    nusukCard: {
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: SPACING.sm,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    nusukTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        marginBottom: 4,
        color: theme.text,
    },
    nusukDesc: {
        fontSize: FONT_SIZES.small,
        marginBottom: SPACING.md,
        color: theme.textSecondary,
    },
    appButtonsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    appButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary,
    },
    appButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    appButtonText: {
        fontSize: FONT_SIZES.small,
        fontWeight: 'bold',
        color: theme.primary,
    },
});
