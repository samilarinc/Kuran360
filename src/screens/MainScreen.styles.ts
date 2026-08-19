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
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingVertical: SPACING.md,
        },
        menuItem: {
            ...common.card,
            borderWidth: 1,
            padding: SPACING.md,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 110,
        },
        menuItemContent: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconContainer: {
            width: 52,
            height: 52,
            borderRadius: 26,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: SPACING.sm,
        },
        menuIcon: {
            fontSize: 26,
        },
        menuTextContainer: {
            alignItems: 'center',
        },
        menuTitle: {
            fontSize: FONT_SIZES.medium,
            fontWeight: '700',
            textAlign: 'center',
            color: theme.text,
        },
        menuSubtitle: {
            fontSize: FONT_SIZES.small,
            lineHeight: FONT_SIZES.small * 1.3,
            color: theme.textSecondary,
            textAlign: 'center',
            marginTop: 2,
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
