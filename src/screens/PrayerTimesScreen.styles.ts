import { StyleSheet } from 'react-native';
import { Theme, SPACING, RADIUS, FONT_SIZES } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';

export const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        hero: {
            ...common.card,
            backgroundColor: theme.primary,
            borderRadius: RADIUS.xl,
            padding: SPACING.lg,
            alignItems: 'center',
        },
        heroTopRow: {
            ...common.rowBetween,
            width: '100%',
            marginBottom: SPACING.sm,
        },
        locationButton: {
            ...common.rowGap,
            flexShrink: 1,
            gap: 6,
            paddingVertical: SPACING.xs,
            paddingHorizontal: SPACING.sm + 4,
            borderRadius: RADIUS.xl,
            backgroundColor: 'rgba(255,255,255,0.15)',
        },
        locationName: {
            fontSize: FONT_SIZES.medium + 1,
            fontWeight: '700',
            color: '#FFF',
            flexShrink: 1,
        },
        dateText: {
            fontSize: 15,
            color: 'rgba(255,255,255,0.9)',
        },
        hicriText: {
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 2,
        },
        countdownBlock: {
            width: '100%',
            alignItems: 'center',
            marginTop: SPACING.lg,
        },
        countdownLabel: {
            fontSize: 15,
            color: 'rgba(255,255,255,0.85)',
        },
        countdown: {
            fontSize: 48,
            fontWeight: '700',
            color: '#FFF',
            fontVariant: ['tabular-nums'],
            letterSpacing: 1,
            marginVertical: SPACING.xs,
        },
        heroProgress: {
            width: '100%',
            marginTop: SPACING.sm,
        },
        heroProgressLabels: {
            ...common.rowBetween,
            width: '100%',
            marginTop: 6,
        },
        heroProgressText: {
            fontSize: FONT_SIZES.small,
            color: 'rgba(255,255,255,0.8)',
            fontWeight: '600',
        },
        timesCard: {
            ...common.card,
            padding: 0,
            overflow: 'hidden',
        },
        timeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: SPACING.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
            borderLeftWidth: 4,
            borderLeftColor: 'transparent',
        },
        timeRowLast: {
            borderBottomWidth: 0,
        },
        currentTimeRow: {
            backgroundColor: theme.primary + '15',
            borderLeftColor: theme.primary,
        },
        timeIcon: {
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
        },
        timeLabel: {
            fontSize: 17,
            color: theme.text,
            marginLeft: SPACING.sm + 4,
            flex: 1,
        },
        timeValue: {
            fontSize: 20,
            fontWeight: '700',
            color: theme.text,
            fontVariant: ['tabular-nums'],
        },
        currentText: {
            fontWeight: '700',
            color: theme.primary,
        },
        nowBadge: {
            backgroundColor: theme.primary,
            alignSelf: 'center',
            marginRight: SPACING.sm + 4,
        },
        nowBadgeText: {
            color: '#FFF',
        },
        modalContent: {
            ...common.modalContent,
            backgroundColor: theme.cardBackground,
            width: '90%',
            maxHeight: '80%',
            padding: 20,
        },
        searchContainer: {
            borderRadius: 8,
            paddingHorizontal: 12,
            marginBottom: 16,
            borderColor: theme.border,
            width: '100%',
        },
        locationItem: {
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
    });
};
