import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        ...common,
        header: {
            paddingHorizontal: SPACING.lg,
            alignItems: 'center',
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            position: 'relative',
            backgroundColor: theme.cardBackground, // Ensure header has bg
        },
        darkModeToggle: {
            position: 'absolute',
            right: SPACING.md,
            top: SPACING.lg,
            padding: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 16,
            minWidth: 32,
            alignItems: 'center',
            zIndex: 1,
        },
        darkModeIcon: {
            fontSize: 16,
            color: theme.text,
        },
        logoContainer: {
            alignItems: 'center',
        },
        logoPlaceholder: {
            width: 80,
            height: 80,
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: SPACING.md,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            backgroundColor: theme.background,
        },
        logoText: {
            fontSize: 30,
            marginBottom: -5,
            color: theme.primary,
        },
        logoTextArabic: {
            fontSize: 18,
            fontWeight: '600',
            fontFamily: 'serif',
            color: theme.primary,
        },
        logoImage: {
            width: 50,
            height: 50,
        },
        appTitle: {
            ...common.title,
            fontSize: FONT_SIZES.xlarge,
            fontWeight: '700',
            marginBottom: SPACING.xs,
        },
        appSubtitle: {
            ...common.subtitle,
            fontWeight: '400',
            opacity: 0.9,
        },
        contentContainer: {
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.xl,
            paddingBottom: SPACING.xl,
        },
        welcomeText: {
            ...common.title,
            fontSize: FONT_SIZES.xlarge,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: SPACING.sm,
        },
        descriptionText: {
            ...common.text,
            textAlign: 'center',
            lineHeight: FONT_SIZES.medium * 1.4,
            marginBottom: SPACING.xl,
            paddingHorizontal: SPACING.md,
        },
        menuContainer: {
            paddingVertical: SPACING.md,
        },
        menuItem: {
            ...common.card, // Reuse card style
            padding: SPACING.lg,
        },
        menuItemContent: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        iconContainer: {
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
            backgroundColor: theme.primary + '15', // Transparent primary
        },
        menuIcon: {
            fontSize: 24,
            color: theme.primary,
        },
        menuTextContainer: {
            flex: 1,
        },
        menuTitle: {
            fontSize: FONT_SIZES.large,
            fontWeight: '600',
            marginBottom: SPACING.xs,
            color: theme.text,
        },
        menuSubtitle: {
            fontSize: FONT_SIZES.medium,
            lineHeight: FONT_SIZES.medium * 1.3,
            color: theme.textSecondary,
        },
        arrowContainer: {
            width: 30,
            height: 30,
            borderRadius: 15,
            borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
            borderColor: theme.border,
        },
        arrow: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.textSecondary,
        },
        footer: {
            alignItems: 'center',
            paddingVertical: SPACING.xl,
            paddingHorizontal: SPACING.lg,
        },
        footerText: {
            ...common.smallText,
            fontStyle: 'italic',
            textAlign: 'center',
            marginBottom: SPACING.xs,
        },
        footerReference: {
            ...common.smallText,
            textAlign: 'center',
        },
    });
};
