import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        section: {
            marginBottom: SPACING.xl,
        },
        sectionTitle: {
            ...common.titleLarge,
            marginBottom: SPACING.md,
        },
        checklistText: {
            fontSize: FONT_SIZES.medium,
            flex: 1,
            color: theme.text,
        },
    });
};
