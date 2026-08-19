import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';

export const createStyles = (theme: any, large: boolean, hasSubtitle: boolean) => StyleSheet.create({
    header: {
        backgroundColor: theme.primary,
        paddingVertical: large ? SPACING.md : SPACING.xs,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        position: 'relative',
        minHeight: large ? 64 : 48,
        justifyContent: 'center',
    },
    title: {
        fontSize: large ? FONT_SIZES.xxlarge : FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.headerText,
        marginBottom: hasSubtitle ? 2 : 0,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZES.small,
        color: theme.headerText,
        opacity: 0.9,
        textAlign: 'center',
    },
    leftButton: {
        position: 'absolute',
        left: SPACING.md,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 1,
    },
    leftButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    rightButtons: {
        position: 'absolute',
        right: SPACING.md,
        top: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        zIndex: 1,
    },
    autoplayToggleWrapper: {
        marginRight: SPACING.xs,
    },
    actionButton: {
        padding: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        minWidth: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        color: theme.headerText,
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    backButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    contentContainer: {
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
});
