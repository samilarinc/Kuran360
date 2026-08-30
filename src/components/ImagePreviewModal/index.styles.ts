import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);
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
    controlRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        justifyContent: 'center',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        minWidth: 100,
        justifyContent: 'center',
    },
    controlButtonBg: {
        backgroundColor: theme.cardBackground,
    },
    controlButtonActive: {
        backgroundColor: theme.primary,
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
    sizeButtonSelected: {
        backgroundColor: theme.primary,
    },
    sizeIcon: {
        marginBottom: SPACING.xs,
    },
    sizeTitle: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: SPACING.xs,
        color: theme.text,
    },
    sizeDescription: {
        fontSize: FONT_SIZES.small - 2,
        textAlign: 'center',
        marginBottom: SPACING.xs,
        color: theme.textSecondary,
    },
    sizeDimensions: {
        fontSize: FONT_SIZES.small - 2,
        textAlign: 'center',
        fontFamily: 'monospace',
        color: theme.textSecondary,
    },
    textOnPrimary: {
        color: '#fff',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    loadingText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    loadingTextSpacing: {
        marginLeft: SPACING.xs,
    },
    actionsContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        marginBottom: SPACING.sm,
        color: theme.text,
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
        backgroundColor: theme.cardBackground,
    },
    actionIcon: {
        marginRight: SPACING.xs,
    },
    actionText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '500',
        color: theme.text,
    },
    actionTextSmall: {
        fontSize: 12,
    },
    shareContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    platformList: {
        gap: SPACING.sm,
    },
    platformButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        backgroundColor: theme.cardBackground,
    },
    platformIcon: {
        marginRight: SPACING.md,
    },
    platformName: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '500',
        color: theme.text,
    },
    verseInfo: {
        margin: SPACING.lg,
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.surface,
    },
    verseInfoText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    verseInfoTextSpacing: {
        marginLeft: SPACING.xs,
    },
    hiddenCapture: {
        position: 'absolute',
        left: -9999,
        top: 0,
        opacity: 0,
    },
    fontLabelArDefault: {
        fontSize: 20,
        color: theme.text,
    },
    fontLabelArSelected: {
        fontSize: 20,
        color: '#fff',
    },
    fontLabelTrDefault: {
        fontSize: 10,
        marginTop: 2,
        color: theme.textSecondary,
    },
    fontLabelTrSelected: {
        fontSize: 10,
        marginTop: 2,
        color: '#fff',
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
