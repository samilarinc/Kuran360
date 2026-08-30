import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);
    return StyleSheet.create({
        container: {
            ...common.centerFill,
            gap: SPACING.md,
        },
        text: {
            fontSize: FONT_SIZES.medium,
            color: theme.textSecondary,
        },
        note: {
            fontSize: FONT_SIZES.small,
            color: theme.textSecondary,
        },
    });
};
