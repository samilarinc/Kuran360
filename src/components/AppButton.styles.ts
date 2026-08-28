import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../theme';

export const createStyles = (theme: any) => StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    text: {
        fontWeight: '600',
    },
    icon: {
        fontSize: 18,
    },
    disabled: {
        opacity: 0.6,
    },
    iconMarginRight: {
        marginRight: SPACING.xs,
    },
    iconMarginLeft: {
        marginLeft: SPACING.xs,
    },
    bgPrimary: {
        backgroundColor: theme.primary,
    },
    bgSecondary: {
        backgroundColor: theme.secondary,
    },
    bgDanger: {
        backgroundColor: theme.error,
    },
    bgTranslucent: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    bgTransparent: {
        backgroundColor: 'transparent',
    },
    bgDisabled: {
        backgroundColor: theme.border,
    },
    textWhite: {
        color: '#FFFFFF',
    },
    textPrimary: {
        color: theme.primary,
    },
    textDisabled: {
        color: theme.textSecondary,
    },
    borderOutline: {
        borderWidth: 1,
        borderColor: theme.primary,
    },
    borderOutlineDisabled: {
        borderWidth: 1,
        borderColor: theme.border,
    },
    shapePill: {
        borderRadius: 999,
    },
    shapeCircleSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    shapeCircleMedium: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    shapeCircleLarge: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    paddingSmall: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
    },
    paddingMedium: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    paddingLarge: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
    },
    fontSmall: {
        fontSize: FONT_SIZES.small,
    },
    fontMedium: {
        fontSize: FONT_SIZES.medium,
    },
    fontLarge: {
        fontSize: FONT_SIZES.large,
    },
});
