import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ModernSwitch } from '../ModernSwitch';
import { Theme, SPACING } from '@/theme';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';

interface SettingItemProps {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon?: React.ReactNode;
    iconColor?: string;
    theme: Theme;
    disabled?: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({
    title,
    description,
    value,
    onValueChange,
    icon,
    iconColor,
    theme,
    disabled = false
}) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <View style={[styles.settingItem, disabled && common.disabled]}>
            <View style={common.rowFill}>
                {icon && (
                    <View style={[styles.settingIconWrap, iconColor && { backgroundColor: iconColor + '1A' }, disabled && common.disabled]}>
                        {icon}
                    </View>
                )}
                <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>
                        {title}
                    </Text>
                    <Text style={[styles.settingDescription, disabled && styles.settingDescriptionDisabled]}>
                        {description}
                    </Text>
                </View>
            </View>
            <ModernSwitch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                theme={theme}
            />
        </View>
    );
};

export const createStyles = (theme: Theme, common: CommonStyles) => {

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
