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
        heroCard: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 18,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
        },
        heroIconWrap: {
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.18)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
        },
        heroIcon: {
            fontSize: 24,
        },
        heroTextWrap: {
            flex: 1,
        },
        heroTitle: {
            fontSize: FONT_SIZES.large,
            fontWeight: '700',
            color: '#fff',
        },
        heroSubtitle: {
            fontSize: FONT_SIZES.small,
            color: 'rgba(255,255,255,0.85)',
            marginTop: 2,
        },
        heroChevron: {
            fontSize: FONT_SIZES.xlarge,
            color: 'rgba(255,255,255,0.85)',
            fontWeight: '300',
        },
        sectionBlock: {
            marginBottom: SPACING.lg,
        },
        sectionHeader: {
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
            letterSpacing: 0.5,
            marginBottom: SPACING.sm,
            marginLeft: SPACING.xs,
        },
        sectionCard: {
            borderRadius: 16,
            borderWidth: 1,
            overflow: 'hidden',
        },
        menuRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: SPACING.sm + 4,
            paddingHorizontal: SPACING.md,
        },
        menuRowDivider: {
            borderBottomWidth: 1,
        },
        rowIconWrap: {
            width: 36,
            height: 36,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
        },
        rowIcon: {
            fontSize: 18,
        },
        rowTitle: {
            flex: 1,
            fontSize: FONT_SIZES.medium,
            fontWeight: '500',
        },
        rowChevron: {
            fontSize: FONT_SIZES.large,
            fontWeight: '300',
            marginLeft: SPACING.sm,
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
