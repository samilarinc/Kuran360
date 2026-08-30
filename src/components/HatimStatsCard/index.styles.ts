import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        infoCard: {
            ...common.infoCard,
            marginBottom: SPACING.xl,
        },
        description: {
            ...common.subtitle,
            lineHeight: 22,
            marginBottom: SPACING.lg,
        },
        deadlineInfo: {
            alignItems: 'center',
            marginBottom: SPACING.md,
        },
        deadlineText: {
            fontSize: 14,
            fontWeight: '700',
            marginTop: SPACING.xs,
            textAlign: 'center',
            marginBottom: SPACING.md,
            color: theme.primary,
        },
        countdownBadge: {
            paddingHorizontal: 12,
            marginTop: 4,
            alignSelf: 'center',
        },
        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0,0.05)',
            paddingTop: SPACING.lg,
        },
        statColumn: {
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: SPACING.md,
        },
        statValue: {
            fontSize: FONT_SIZES.large,
            fontWeight: '700',
        },
        statValueCompleted: {
            color: '#4CAF50',
        },
        statValueClaimed: {
            color: theme.primary,
        },
        miniProgressBarBackground: {
            marginTop: SPACING.sm,
        },
    });
};
