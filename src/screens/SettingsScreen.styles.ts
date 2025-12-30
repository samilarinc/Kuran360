import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        ...common,
        container: {
            ...common.container,
        },
        content: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.xl,
        },

        // Quick Settings Section
        quickSettingsSection: {
            backgroundColor: theme.cardBackground,
            borderRadius: 16,
            marginTop: SPACING.md,
            marginBottom: SPACING.lg,
            overflow: 'hidden',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
        },
        quickSettingsTitle: {
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
            color: theme.secondary,
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.md,
            paddingBottom: SPACING.xs,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },

        // Section Styles
        section: {
            backgroundColor: theme.cardBackground,
            borderRadius: 16,
            marginBottom: SPACING.lg,
            overflow: 'hidden',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: SPACING.lg,
            backgroundColor: theme.primary + '08',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        sectionHeaderContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        sectionIcon: {
            fontSize: 24,
            marginRight: SPACING.md,
        },
        sectionHeaderText: {
            flex: 1,
        },
        sectionTitle: {
            fontSize: FONT_SIZES.medium,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 2,
        },
        sectionSubtitle: {
            fontSize: FONT_SIZES.small,
            color: theme.secondary,
        },
        expandButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.border + '30',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: SPACING.md,
        },
        expandButtonActive: {
            backgroundColor: theme.primary + '20',
        },
        expandIcon: {
            fontSize: 12,
            color: theme.secondary,
            fontWeight: '600',
        },
        expandIconActive: {
            color: theme.primary,
        },
        sectionContent: {
            backgroundColor: theme.cardBackground,
        },

        // Setting Item Styles
        settingItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border + '30',
        },
        settingItemDisabled: {
            opacity: 0.5,
        },
        settingContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        settingIcon: {
            fontSize: 20,
            marginRight: SPACING.md,
        },
        settingInfo: {
            flex: 1,
            marginRight: SPACING.md,
        },
        settingLabel: {
            fontSize: FONT_SIZES.medium,
            fontWeight: '500',
            color: theme.text,
            marginBottom: 2,
        },
        settingLabelDisabled: {
            color: theme.secondary,
        },
        settingDescription: {
            fontSize: FONT_SIZES.small,
            color: theme.secondary,
            lineHeight: 18,
        },
        settingDescriptionDisabled: {
            color: theme.border,
        },

        // Modern Switch Styles
        webSwitch: {
            transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
            marginLeft: SPACING.sm,
        },
        modernSwitch: {
            transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
            marginLeft: SPACING.sm,
        },
        modernSwitchContainer: {
            padding: SPACING.xs,
        },
        modernSwitchTrack: {
            width: 48,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
        },
        modernSwitchDisabled: {
            opacity: 0.6,
        },
        modernSwitchThumb: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            position: 'absolute',
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
        },
        modernSwitchThumbActive: {
            backgroundColor: '#FFFFFF',
        },

        // Reciter Container
        reciterContainer: {
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.md,
        },

        // Translation Styles
        translationActions: {
            flexDirection: 'row',
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.md,
            paddingBottom: SPACING.sm,
            gap: SPACING.sm,
        },
        actionButton: {
            flex: 1,
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        primaryActionButton: {
            backgroundColor: theme.primary,
        },
        secondaryActionButton: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: theme.primary,
        },
        primaryActionButtonText: {
            color: '#FFFFFF',
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
        },
        secondaryActionButtonText: {
            color: theme.primary,
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
        },
        translationsContainer: {
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.md,
        },
        favoriteExplanation: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm,
            backgroundColor: '#FFD700' + '10',
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING.sm,
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: '#FFD700',
        },
        favoriteExplanationText: {
            fontSize: FONT_SIZES.small,
            color: '#B8860B',
            fontStyle: 'italic',
            textAlign: 'center',
        },
        translationItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.md,
            marginBottom: SPACING.xs,
            borderRadius: 12,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
        },
        firstTranslationItem: {
            marginTop: SPACING.xs,
        },
        lastTranslationItem: {
            marginBottom: 0,
        },
        selectedTranslationItem: {
            backgroundColor: theme.primary + '10',
            borderColor: theme.primary,
        },
        favoriteTranslationItem: {
            backgroundColor: '#FFD700' + '15', // Altın sarısı tint
            borderColor: '#FFD700',
            borderWidth: 2,
        },
        translationMainContent: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        translationText: {
            flex: 1,
            fontSize: FONT_SIZES.small,
            color: theme.text,
            fontWeight: '500',
        },
        selectedTranslationText: {
            color: theme.primary,
            fontWeight: '600',
        },
        favoriteTranslationText: {
            color: '#B8860B', // Koyu altın
            fontWeight: '700',
        },
        favoriteButton: {
            padding: SPACING.xs,
            marginLeft: SPACING.sm,
            borderRadius: 12,
            backgroundColor: 'transparent',
        },
        favoriteIcon: {
            fontSize: 20,
            color: theme.border,
        },
        favoriteIconActive: {
            color: '#FFD700', // Altın sarısı
        },
        modernCheckbox: {
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
        },
        modernCheckboxSelected: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        modernCheckmark: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 'bold',
        },
        footer: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.lg,
            alignItems: 'center',
        },
        footerText: {
            fontSize: FONT_SIZES.small,
            color: theme.secondary,
            textAlign: 'center',
            fontStyle: 'italic',
        },
    });
};
