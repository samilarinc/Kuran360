import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '../theme';
import { createCommonStyles } from '../theme/common.styles';

// Plain (non-RN) CSS object for the invisible web <input type="date"> overlay.
// Not run through StyleSheet.create since it uses DOM-only CSS properties
// (cursor, outline, appearance) that aren't valid React Native style keys.
export const webDateInputStyle: any = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
    border: 'none',
    outline: 'none',
    // @ts-ignore
    appearance: 'none',
};

export const createStyles = (theme: any) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
    container: common.container,
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        ...common.titleLarge,
        marginBottom: SPACING.md,
    },
    plannerCard: {
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SPACING.lg,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    plannerTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
        color: theme.text,
    },
    compactTripRow: {
        paddingVertical: SPACING.xs,
    },
    compactTripMain: {
        gap: SPACING.sm,
    },
    compactCitySelect: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    cityChip: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
        gap: 4,
        backgroundColor: theme.background,
        borderColor: theme.border,
    },
    cityChipText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    cityChipTextFilled: {
        color: theme.text,
    },
    cityChipTextPlaceholder: {
        color: theme.textSecondary,
    },
    chipDropdownArrow: {
        fontSize: 10,
        color: theme.textSecondary,
    },
    tripArrow: {
        fontSize: 16,
        color: theme.textSecondary,
    },
    destinationChips: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
    },
    destinationChip: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: theme.border,
    },
    destinationChipActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    destinationChipText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.text,
    },
    destinationChipTextActive: {
        color: '#FFFFFF',
    },
    compactDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingLeft: SPACING.xs,
    },
    compactDateLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.textSecondary,
    },
    compactDateText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
    },
    compactDateTextFilled: {
        color: theme.primary,
    },
    compactDateTextPlaceholder: {
        color: theme.textSecondary,
    },
    webDateInputWrapper: {
        flex: 1,
        position: 'relative',
        height: 35,
        justifyContent: 'center',
    },
    dateTouchable: {
        flex: 1,
    },
    plannerDivider: {
        height: 1,
        marginVertical: SPACING.md,
        opacity: 0.5,
        backgroundColor: theme.border,
    },
    plannerActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    plannerActionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary,
    },
    plannerActionBtnTall: {
        minHeight: 44,
    },
    plannerActionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.primary,
    },
    compactReminder: {
        marginTop: SPACING.md,
        padding: SPACING.sm,
        borderRadius: 10,
        backgroundColor: theme.primary + '15',
    },
    compactReminderText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    reminderTextPrimary: {
        color: theme.primary,
    },
    transferDescriptionText: {
        color: theme.textSecondary,
        textAlign: 'left',
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: FONT_SIZES.medium,
    },
    pickerButton: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        fontSize: FONT_SIZES.medium,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerButtonText: {
        fontSize: FONT_SIZES.medium,
    },
    pickerArrow: {
        fontSize: FONT_SIZES.small,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 12,
        padding: SPACING.lg,
        maxHeight: '80%',
        backgroundColor: theme.surface,
    },
    modalTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
        textAlign: 'center',
        color: theme.text,
    },
    modalOption: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    modalOptionText: {
        fontSize: FONT_SIZES.medium,
        textAlign: 'center',
        color: theme.text,
    },
    destinationButtons: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    destinationButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        alignItems: 'center',
    },
    destinationButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    destinationButtonSmall: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 6,
        padding: SPACING.sm,
        alignItems: 'center',
    },
    destinationButtonTextSmall: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    dateButton: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateButtonText: {
        fontSize: FONT_SIZES.medium,
    },
    reminder: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        borderRadius: 8,
        borderWidth: 1,
    },
    reminderText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    infoText: {

        fontSize: FONT_SIZES.small,
        marginBottom: SPACING.sm,
        fontStyle: 'italic',
    },
    linkButton: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    linkButtonText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
    },
    appLinks: {
        marginTop: SPACING.md,
    },
    appLinksTitle: {
        fontSize: FONT_SIZES.medium,
        marginBottom: SPACING.sm,
    },
    nusukCard: {
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: SPACING.sm,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    nusukTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
        marginBottom: 4,
        color: theme.text,
    },
    nusukDesc: {
        fontSize: FONT_SIZES.small,
        marginBottom: SPACING.md,
        color: theme.textSecondary,
    },
    appButtonsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    appButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary,
    },
    appButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    appButtonText: {
        fontSize: FONT_SIZES.small,
        fontWeight: 'bold',
        color: theme.primary,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
        borderColor: theme.border,
    },
    checkboxChecked: {
        backgroundColor: theme.primary,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checklistText: {
        fontSize: FONT_SIZES.medium,
        flex: 1,
        color: theme.text,
    },
    checkedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    bottomSpacer: {
        height: SPACING.xl,
    },
    });
};
