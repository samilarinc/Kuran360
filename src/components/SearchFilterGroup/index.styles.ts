import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        selectorContainer: {
            marginBottom: SPACING.md,
        },
        selectorTitle: {
            ...common.sectionLabel,
            color: theme.secondary,
            marginBottom: SPACING.xs,
            textTransform: 'uppercase',
        },
        selectorGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.xs,
        },
    });
};
