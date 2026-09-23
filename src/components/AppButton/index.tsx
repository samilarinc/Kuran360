import React from 'react';
import { ActivityIndicator, TouchableOpacity, Text, StyleProp, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '@/theme';

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
    const [background, foreground] = disabled
        ? [theme.border, theme.textSecondary]
        : ({
            primary: [theme.primary, '#FFFFFF'],
            secondary: [theme.secondary, '#FFFFFF'],
            danger: [theme.error, '#FFFFFF'],
            translucent: ['rgba(255, 255, 255, 0.2)', '#FFFFFF'],
            outline: ['transparent', theme.primary],
            ghost: ['transparent', theme.primary],
        } as const)[variant];
    const sizing = SIZES[size];
    const textColor = { color: foreground };

    const buttonStyles = [
        styles.button,
        { backgroundColor: background },
        variant === 'outline' && { borderWidth: 1, borderColor: disabled ? theme.border : theme.primary },
        shape === 'pill' && styles.pill,
        shape === 'circle'
            ? { width: sizing.circle, height: sizing.circle, borderRadius: sizing.circle / 2 }
            : { paddingVertical: sizing.paddingVertical, paddingHorizontal: sizing.paddingHorizontal },
        style,
        disabled && styles.disabled,
    ];

    const renderIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            return <Text style={[styles.icon, textColor]}>{icon}</Text>;
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
                        <Text style={[styles.text, textColor, { fontSize: sizing.fontSize }, textStyle]}>
                            {title}
                        </Text>
                    )}
                    {iconPosition === 'right' && renderIcon()}
                </>
            )}
        </TouchableOpacity>
    );
};

const SIZES = {
    small: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, fontSize: FONT_SIZES.small, circle: 36 },
    medium: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, fontSize: FONT_SIZES.medium, circle: 48 },
    large: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, fontSize: FONT_SIZES.large, circle: 60 },
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        borderRadius: 8,
    },
    pill: {
        borderRadius: 999,
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
