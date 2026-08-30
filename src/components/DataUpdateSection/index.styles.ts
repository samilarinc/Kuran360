import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        updateButton: {
            backgroundColor: theme.primary + '10',
            borderRadius: 12,
            padding: SPACING.md,
            margin: SPACING.lg,
        },
    });
};
