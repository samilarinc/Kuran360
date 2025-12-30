import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../theme';

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

    const getBackgroundColor = () => {
        if (disabled) return theme.border;
        switch (variant) {
            case 'primary': return theme.primary;
            case 'secondary': return theme.secondary; // Or a dedicated secondary color if different
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return theme.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.textSecondary;
        switch (variant) {
            case 'primary': return '#FFFFFF';
            case 'secondary': return '#FFFFFF';
            case 'outline': return theme.primary;
            case 'ghost': return theme.primary;
            default: return '#FFFFFF';
        }
    };

    const getBorder = () => {
        if (variant === 'outline') {
            return {
                borderWidth: 1,
                borderColor: disabled ? theme.border : theme.primary,
            };
        }
        return {};
    };

    const getPadding = () => {
        switch (size) {
            case 'small': return { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm };
            case 'large': return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl };
            default: return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small': return FONT_SIZES.small;
            case 'large': return FONT_SIZES.large;
            default: return FONT_SIZES.medium;
        }
    };

    const buttonStyles = [
        styles.button,
        { backgroundColor: getBackgroundColor() },
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
            {icon && <Text style={[styles.icon, { color: getTextColor(), marginRight: SPACING.xs }]}>{icon}</Text>}
            <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }, textStyle]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    text: {
        fontWeight: '600',
    },
    icon: {
        fontSize: 18,
    },
    disabled: {
        opacity: 0.6,
    },
});
