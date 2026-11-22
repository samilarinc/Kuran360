import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface ProgressRingProps {
    /** 0–100 */
    progress: number;
    size: number;
    strokeWidth?: number;
    color?: string;
    trackColor?: string;
    style?: StyleProp<ViewStyle>;
    /** Drawn in the middle of the ring */
    children?: React.ReactNode;
}

/** A circular progress track that fills clockwise from the top; anything passed as children sits inside it. */
export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size,
    strokeWidth = 4,
    color,
    trackColor,
    style,
    children,
}) => {
    const { theme } = useTheme();
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, progress));

    return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={trackColor ?? theme.border}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {clamped > 0 && (
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color ?? theme.accent}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={circumference * (1 - clamped / 100)}
                        // Start at 12 o'clock
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                )}
            </Svg>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    center: { alignItems: 'center', justifyContent: 'center' },
});
