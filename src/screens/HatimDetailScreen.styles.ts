import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../constants';
import { createCommonStyles } from '../theme/common.styles';

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
    ...common,
    notFoundText: {
        color: theme.text,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    infoCard: {
        ...common.infoCard,
        marginBottom: SPACING.xl,
    },
    description: {
        ...common.subtitle,
        lineHeight: 22,
        marginBottom: SPACING.lg,
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
    miniProgressBarBackground: {
        marginTop: SPACING.sm,
    },
    gridContainer: {
        width: '100%',
        alignSelf: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    partItem: {
        ...common.card,
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xs,
        shadowRadius: 2,
        borderColor: theme.border,
        marginRight: SPACING.md / 2,
        marginLeft: SPACING.md / 2,
    },
    partNumber: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '700',
    },
    partClaimant: {
        fontSize: 10,
        marginTop: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    progressBarBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
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
    statLabel: {
        ...common.smallText,
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
        ...common.badge,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginTop: 4,
        alignSelf: 'center',
        backgroundColor: theme.primary + '15',
    },
    countdownText: {
        ...common.badgeText,
        fontWeight: '700',
        color: theme.primary,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.lg,
    },
    modalButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        marginLeft: SPACING.md,
        minWidth: 80,
        alignItems: 'center',
    },
    modalButtonsRight: {
        flexDirection: 'row',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
        color: theme.textSecondary,
    },
    inputLabelNoMarginTop: {
        marginTop: 0,
    },
    editInputStyle: {
        ...common.input,
        minHeight: 50,
        justifyContent: 'center',
    },
    dateTimeTextFilled: {
        color: theme.text,
    },
    dateTimeTextEmpty: {
        color: theme.textSecondary,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    deadlineInfo: {
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    dateTimeWebContainer: {
        marginBottom: 16,
    },
    timeSelectorsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeSeparator: {
        marginHorizontal: 8,
        color: theme.text,
        fontSize: 18,
        fontWeight: '700',
    },
    });
};
