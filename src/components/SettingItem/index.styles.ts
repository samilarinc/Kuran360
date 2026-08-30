import { StyleSheet } from 'react-native';
import { SPACING, Theme } from '@/theme';
import { createCommonStyles } from '@/theme/common.styles';

export const createStyles = (theme: Theme) => {
    const common = createCommonStyles(theme);

    return StyleSheet.create({
        settingItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border + '30',
        },
        settingItemDisabled: {
            opacity: 0.5,
        },
        settingContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        settingIconWrap: {
            width: 36,
            height: 36,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.md,
        },
        settingInfo: {
            flex: 1,
            marginRight: SPACING.md,
        },
        settingLabel: {
            ...common.text,
            fontWeight: '500',
            marginBottom: 2,
        },
        settingLabelDisabled: {
            color: theme.secondary,
        },
        settingDescription: {
            ...common.smallText,
            color: theme.secondary,
            lineHeight: 18,
        },
        settingDescriptionDisabled: {
            color: theme.border,
        },
    });
};
