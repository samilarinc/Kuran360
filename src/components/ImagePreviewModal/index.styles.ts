import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
    overlay: {
        ...common.modalOverlayDark,
        alignItems: 'stretch',
        padding: 0,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
    },
    modal: {
        borderRadius: 20,
        maxHeight: '90%',
        minHeight: '60%',
        backgroundColor: theme.background,
    },
    imageContainer: {
        margin: SPACING.lg,
        borderRadius: 12,
        padding: SPACING.sm,
        alignItems: 'center',
        backgroundColor: theme.surface,
    },
    image: {
        width: '100%',
        height: 300,
        borderRadius: 8,
    },
    controlSection: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        minWidth: 100,
        justifyContent: 'center',
        gap: SPACING.xs,
        backgroundColor: theme.cardBackground,
    },
    sizeScrollView: {
        marginVertical: SPACING.sm,
    },
    sizeRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.sm,
    },
    sizeButton: {
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 120,
        maxWidth: 140,
        backgroundColor: theme.cardBackground,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    loadingText: {
        marginLeft: SPACING.xs,
        fontSize: FONT_SIZES.small,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        minWidth: 100,
        gap: SPACING.xs,
        backgroundColor: theme.cardBackground,
    },
    actionText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '500',
        color: theme.text,
    },
    platformButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        backgroundColor: theme.cardBackground,
    },
    verseInfo: {
        margin: SPACING.lg,
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.surface,
    },
    verseInfoText: {
        marginLeft: SPACING.xs,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    fontLabelAr: {
        fontSize: 20,
        color: theme.text,
    },
    fontLabelTr: {
        fontSize: 10,
        marginTop: 2,
        color: theme.textSecondary,
    },
    scaleButtonTextSmall: {
        fontSize: 14,
        color: theme.text,
        fontWeight: '700',
    },
    scaleButtonTextLarge: {
        fontSize: 20,
        color: theme.text,
        fontWeight: '700',
    },
    });
};
