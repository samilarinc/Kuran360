import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
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
    plannerDivider: {
        height: 1,
        marginVertical: SPACING.md,
        opacity: 0.5,
        backgroundColor: theme.border,
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
});
