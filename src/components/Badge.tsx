import React, { useMemo } from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './Badge.styles';

export type BadgeVariant = 'solid' | 'tint';
export type BadgeShape = 'rounded' | 'pill';
export type BadgeSize = 'small' | 'medium';

interface BadgeProps {
    label: string;
    icon?: React.ReactNode;
    variant?: BadgeVariant;
    color?: string;
    shape?: BadgeShape;
    size?: BadgeSize;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    icon,
    variant = 'solid',
    color,
    shape = 'rounded',
    size = 'medium',
    style,
    textStyle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const baseColor = color ?? theme.primary;

    return (
        <View
            style={[
                styles.badge,
                size === 'small' ? styles.sizeSmall : styles.sizeMedium,
                { borderRadius: shape === 'pill' ? 999 : (size === 'small' ? 8 : 12) },
                { backgroundColor: variant === 'solid' ? baseColor : baseColor + '15' },
                icon && styles.withIcon,
                style,
            ]}
        >
            {icon}
            <Text
                style={[
                    styles.text,
                    size === 'small' ? styles.textSmall : styles.textMedium,
                    { color: variant === 'solid' ? '#FFFFFF' : baseColor },
                    textStyle,
                ]}
            >
                {label}
            </Text>
        </View>
    );
};
