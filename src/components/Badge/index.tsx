import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';

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
    const styles = useThemedStyles(createStyles);
    const baseColor = color ?? theme.primary;

    return (
        <View
            style={[
                styles.badge,
                size === 'small' ? styles.sizeSmall : styles.sizeMedium,
                { borderRadius: shape === 'pill' ? 999 : (size === 'small' ? 8 : 12) },
                { backgroundColor: variant === 'solid' ? baseColor : baseColor + '15' },
                !!icon && styles.withIcon,
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

const createStyles = (_theme: Theme) => StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
    },
    withIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sizeSmall: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    sizeMedium: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
    },
    text: {
        fontWeight: '600',
    },
    textSmall: {
        fontSize: 10,
        fontWeight: '700',
    },
    textMedium: {
        fontSize: 12,
    },
});
