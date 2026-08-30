import { StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';
import { Theme } from '@/contexts/ThemeContext';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);
    return StyleSheet.create({
        overlay: {
            ...common.modalOverlay,
            padding: 0,
        },
        optionList: {
            padding: SPACING.sm,
        },
        optionItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: SPACING.md,
            marginVertical: SPACING.xs,
            borderRadius: 8,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: 'transparent',
        },
        optionItemSelected: {
            backgroundColor: theme.primary + '10',
            borderColor: theme.primary + '30',
        },
        optionLabel: {
            fontSize: FONT_SIZES.medium,
            color: theme.text,
            flex: 1,
        },
        optionLabelSelected: {
            color: theme.primary,
            fontWeight: '600',
        },
        checkmark: {
            fontSize: FONT_SIZES.medium,
            color: theme.primary,
            fontWeight: 'bold',
            marginLeft: SPACING.sm,
        },
    });
};
