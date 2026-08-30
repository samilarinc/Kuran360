import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);
    return StyleSheet.create({
        container: {
            ...common.centerFill,
            gap: SPACING.lg,
            padding: SPACING.lg,
        },
        text: {
            fontSize: FONT_SIZES.large,
            textAlign: 'center',
            color: theme.text,
        },
    });
};
