import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
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
});
