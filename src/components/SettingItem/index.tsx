import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { ModernSwitch } from '../ModernSwitch';
import { createStyles } from './index.styles';
import { Theme } from '@/theme';

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
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
            <View style={styles.settingContent}>
                {icon && (
                    <View style={[styles.settingIconWrap, iconColor && { backgroundColor: iconColor + '1A' }, disabled && { opacity: 0.5 }]}>
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
