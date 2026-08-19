import React, { useMemo } from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './AppButton.styles';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    icon?: string;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    icon,
    disabled = false,
    style,
    textStyle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const getBackgroundStyle = () => {
        if (disabled) return styles.bgDisabled;
        switch (variant) {
            case 'primary': return styles.bgPrimary;
            case 'secondary': return styles.bgSecondary; // Or a dedicated secondary color if different
            case 'outline': return styles.bgTransparent;
            case 'ghost': return styles.bgTransparent;
            default: return styles.bgPrimary;
        }
    };

    const getTextColorStyle = () => {
        if (disabled) return styles.textDisabled;
        switch (variant) {
            case 'primary': return styles.textWhite;
            case 'secondary': return styles.textWhite;
            case 'outline': return styles.textPrimary;
            case 'ghost': return styles.textPrimary;
            default: return styles.textWhite;
        }
    };

    const getBorder = () => {
        if (variant === 'outline') {
            return disabled ? styles.borderOutlineDisabled : styles.borderOutline;
        }
        return {};
    };

    const getPadding = () => {
        switch (size) {
            case 'small': return styles.paddingSmall;
            case 'large': return styles.paddingLarge;
            default: return styles.paddingMedium;
        }
    };

    const getFontSizeStyle = () => {
        switch (size) {
            case 'small': return styles.fontSmall;
            case 'large': return styles.fontLarge;
            default: return styles.fontMedium;
        }
    };

    const buttonStyles = [
        styles.button,
        getBackgroundStyle(),
        getBorder(),
        getPadding(),
        style,
        disabled && styles.disabled,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            {icon && <Text style={[styles.icon, getTextColorStyle(), styles.iconMargin]}>{icon}</Text>}
            <Text style={[styles.text, getTextColorStyle(), getFontSizeStyle(), textStyle]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};
