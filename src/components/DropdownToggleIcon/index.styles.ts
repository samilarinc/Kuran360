import { StyleSheet } from 'react-native';
import { FONT_SIZES, Theme } from '@/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
    toggleIcon: {
        fontSize: FONT_SIZES.small,
        color: theme.secondary,
        fontWeight: '600',
    },
});
