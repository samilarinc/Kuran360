import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '../theme';

export const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
        borderRadius: 10,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: theme.border,
    },
    icon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: FONT_SIZES.medium,
        color: theme.text,
    },
    clearButton: {
        padding: SPACING.xs,
    },
    clearButtonText: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
    },
    trailing: {
        marginLeft: SPACING.sm,
    },
});
