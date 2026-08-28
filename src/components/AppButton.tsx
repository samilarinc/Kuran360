import React, { useMemo } from 'react';
import { ActivityIndicator, TouchableOpacity, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './AppButton.styles';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'translucent';
export type AppButtonSize = 'small' | 'medium' | 'large';
export type AppButtonShape = 'default' | 'pill' | 'circle';

interface AppButtonProps {
    title?: string;
    onPress: () => void;
    variant?: AppButtonVariant;
    size?: AppButtonSize;
    shape?: AppButtonShape;
    icon?: string | React.ReactNode;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    shape = 'default',
    icon,
    iconPosition = 'left',
    disabled = false,
    loading = false,
    style,
    textStyle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const getBackgroundStyle = () => {
        if (disabled) return styles.bgDisabled;
        switch (variant) {
            case 'primary': return styles.bgPrimary;
            case 'secondary': return styles.bgSecondary;
            case 'danger': return styles.bgDanger;
            case 'translucent': return styles.bgTranslucent;
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
            case 'danger': return styles.textWhite;
            case 'translucent': return styles.textWhite;
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

    const getShape = () => {
        switch (shape) {
            case 'pill': return styles.shapePill;
            case 'circle': return styles[`shapeCircle${size === 'small' ? 'Small' : size === 'large' ? 'Large' : 'Medium'}` as const];
            default: return {};
        }
    };

    const getPadding = () => {
        if (shape === 'circle') return {};
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
        getShape(),
        getPadding(),
        style,
        disabled && styles.disabled,
    ];

    const renderIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            return (
                <Text style={[styles.icon, getTextColorStyle(), title && (iconPosition === 'left' ? styles.iconMarginRight : styles.iconMarginLeft)]}>
                    {icon}
                </Text>
            );
        }
        return icon;
    };

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? theme.primary : '#FFFFFF'} />
            ) : (
                <>
                    {iconPosition === 'left' && renderIcon()}
                    {title && (
                        <Text style={[styles.text, getTextColorStyle(), getFontSizeStyle(), textStyle]}>
                            {title}
                        </Text>
                    )}
                    {iconPosition === 'right' && renderIcon()}
                </>
            )}
        </TouchableOpacity>
    );
};
