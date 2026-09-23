import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    preview: {
        width: '100%',
        maxHeight: 420,
        alignSelf: 'center',
        marginBottom: SPACING.sm,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.surface,
    },
});
