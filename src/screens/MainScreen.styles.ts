import { StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        contentContainer: {
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.xl,
        },
        heroCard: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 18,
            padding: SPACING.lg,
            marginBottom: SPACING.lg,
            backgroundColor: theme.primary,
            ...SHADOW.md,
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
        heroTitle: {
            fontSize: FONT_SIZES.large,
            fontWeight: '700',
            color: '#fff',
        },
        heroChevronWrap: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.22)',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: SPACING.sm,
        },
        sectionHeader: {
            ...common.sectionLabel,
            marginBottom: SPACING.sm,
            marginLeft: SPACING.xs,
        },
        sectionCard: {
            borderRadius: 16,
            borderWidth: 1,
            overflow: 'hidden',
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            ...SHADOW.sm,
        },
        menuRowDivider: {
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        footer: {
            alignItems: 'center',
            paddingVertical: SPACING.xl,
            paddingHorizontal: SPACING.lg,
        },
    });
};
