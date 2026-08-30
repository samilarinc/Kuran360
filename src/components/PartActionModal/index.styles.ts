import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        modalContent: {
            ...common.modalContent,
            maxWidth: 400,
        },
        modalDescription: {
            ...common.subtitle,
            textAlign: 'center',
            marginBottom: SPACING.xl,
        },
        claimInfo: {
            alignItems: 'center',
            marginBottom: SPACING.xl,
        },
        claimText: {
            ...common.subtitle,
            marginBottom: SPACING.xs,
        },
        claimedByName: {
            color: theme.text,
            fontWeight: '700',
        },
        claimStatus: {
            fontSize: FONT_SIZES.small,
            fontWeight: '700',
            textTransform: 'uppercase',
        },
        claimStatusCompleted: {
            color: '#4CAF50',
        },
        claimStatusReading: {
            color: '#FF9800',
        },
        modalButtonsColumn: {
            width: '100%',
        },
        progressContainer: {
            marginTop: SPACING.lg,
            alignItems: 'center',
            width: '100%',
        },
        progressLabel: {
            ...common.smallText,
            marginBottom: SPACING.sm,
        },
        progressRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        progressInput: {
            width: 60,
            height: 40,
            borderWidth: 1,
            borderRadius: 8,
            marginHorizontal: SPACING.md,
            textAlign: 'center',
            fontSize: FONT_SIZES.medium,
            fontWeight: '700',
            color: theme.text,
            borderColor: theme.border,
        },
    });
};
