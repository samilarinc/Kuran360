import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        filtersToggle: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.cardBackground,
            padding: SPACING.md,
            borderRadius: 12,
            marginBottom: SPACING.md,
        },
        filtersToggleText: {
            ...common.text,
            fontWeight: '600',
        },
        filtersContainer: {
            backgroundColor: theme.cardBackground,
            borderRadius: 12,
            padding: SPACING.md,
            marginBottom: SPACING.lg,
        },
    });
};
