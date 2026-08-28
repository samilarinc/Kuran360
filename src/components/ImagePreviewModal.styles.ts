import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../constants';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: '600',
        color: theme.text,
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    content: {
        flex: 1,
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
    controlButtonFlex: {
        flex: 1,
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
        fontSize: 24,
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
        fontSize: 18,
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
        fontSize: 20,
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
