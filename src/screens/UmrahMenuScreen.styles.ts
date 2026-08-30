import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => {
    return StyleSheet.create({
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    header: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
        color: theme.text,
    },
    });
};
