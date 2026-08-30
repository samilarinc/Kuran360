import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        inputLabel: {
            ...common.inputLabel,
            color: theme.textSecondary,
        },
        inputLabelNoMarginTop: {
            marginTop: 0,
        },
        editInputStyle: {
            ...common.input,
            minHeight: 50,
            justifyContent: 'center',
        },
        dateTimeTextFilled: {
            color: theme.text,
        },
        dateTimeTextEmpty: {
            color: theme.textSecondary,
        },
        dateTimeWebContainer: {
            marginBottom: 16,
        },
        timeSelectorsRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: SPACING.lg,
        },
        modalButtonsRight: {
            flexDirection: 'row',
        },
    });
};
