import { StyleSheet } from 'react-native';
import { Theme, SPACING, RADIUS, FONT_SIZES } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        card: {
            ...common.card,
            padding: 0,
            overflow: 'hidden',
        },
        warningCard: {
            borderWidth: 1,
            borderColor: theme.warning,
        },
        sectionTitle: {
            ...common.sectionLabel,
            fontSize: FONT_SIZES.medium,
            color: theme.text,
            marginTop: SPACING.sm,
            marginBottom: SPACING.xs,
        },
        sectionDescription: {
            ...common.smallText,
            marginBottom: SPACING.sm,
        },
        prayerRow: {
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        prayerRowLast: {
            borderBottomWidth: 0,
        },
        prayerIcon: {
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.sm + 4,
        },
        prayerTime: {
            fontWeight: '400',
            color: theme.textSecondary,
            fontVariant: ['tabular-nums'],
        },
        beforeRow: {
            marginTop: SPACING.sm,
        },
        subOptions: {
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border + '30',
        },
        soundRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.sm,
            marginTop: SPACING.sm,
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.sm + 4,
            borderRadius: RADIUS.md,
            backgroundColor: theme.background,
        },
        previewButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
        },
        soundItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.sm + 4,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
        },
        beforeLabel: {
            ...common.smallText,
            marginBottom: SPACING.xs,
        },
        pills: {
            ...common.rowWrap,
            gap: 6,
            justifyContent: 'space-between',
        },
        pill: {
            minWidth: 38,
            alignItems: 'center',
            paddingHorizontal: SPACING.sm,
            paddingVertical: 5,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
        },
        pillText: {
            fontSize: FONT_SIZES.small,
            fontWeight: '500',
            color: theme.text,
        },
    });
};
