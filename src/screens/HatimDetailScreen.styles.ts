import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../constants';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    notFoundText: {
        color: theme.text,
    },
    notFoundBackButton: {
        padding: SPACING.sm,
    },
    notFoundBackButtonText: {
        color: theme.primary,
    },
    editButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginLeft: SPACING.xs,
    },
    editButtonText: {
        fontWeight: '600',
        fontSize: 14,
        color: theme.headerText,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    infoCard: {
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SPACING.xl,
        backgroundColor: theme.cardBackground,
        borderColor: theme.border,
    },
    description: {
        fontSize: FONT_SIZES.medium,
        lineHeight: 22,
        marginBottom: SPACING.lg,
        color: theme.textSecondary,
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
        height: 6,
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: SPACING.sm,
        backgroundColor: theme.border,
    },
    miniProgressBarFill: {
        height: '100%',
    },
    miniProgressFillCompleted: {
        backgroundColor: '#4CAF50',
    },
    miniProgressFillClaimed: {
        backgroundColor: theme.primary,
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
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        padding: SPACING.xs,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        padding: SPACING.xl,
        borderRadius: 24,
        elevation: 5,
        backgroundColor: theme.cardBackground,
    },
    modalTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        marginBottom: SPACING.lg,
        textAlign: 'center',
        color: theme.text,
    },
    modalDescription: {
        textAlign: 'center',
        marginBottom: SPACING.xl,
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
    },
    claimInfo: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    claimText: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.xs,
        color: theme.textSecondary,
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
    actionButton: {
        padding: SPACING.md,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    actionButtonAccent: {
        backgroundColor: theme.accent,
    },
    actionButtonPrimary: {
        backgroundColor: theme.primary,
    },
    actionButtonDanger: {
        backgroundColor: '#d32f2f',
        marginTop: SPACING.md,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: FONT_SIZES.medium,
    },
    closeButton: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: theme.border,
    },
    closeButtonText: {
        color: theme.text,
    },
    progressBarBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    progressContainer: {
        marginTop: SPACING.lg,
        alignItems: 'center',
        width: '100%',
    },
    progressLabel: {
        fontSize: 12,
        marginBottom: SPACING.sm,
        color: theme.textSecondary,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.border,
    },
    progressBtnText: {
        color: theme.text,
        fontSize: 20,
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
        fontSize: 12,
        color: theme.textSecondary,
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
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 4,
        backgroundColor: theme.primary + '15',
    },
    countdownText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.primary,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        color: theme.text,
        borderColor: theme.border,
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
    deleteModalButton: {
        backgroundColor: '#FFEBEE',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    deleteModalButtonText: {
        color: '#D32F2F',
        fontWeight: '600',
    },
    modalButtonsRight: {
        flexDirection: 'row',
    },
    cancelModalButton: {
        backgroundColor: theme.border,
        marginRight: SPACING.sm,
    },
    updateModalButton: {
        backgroundColor: theme.primary,
    },
    whiteButtonText: {
        color: '#fff',
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
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        minHeight: 50,
        borderColor: theme.border,
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
