import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

interface ProgressBarProps {
    progress: number;
    height?: number;
    trackColor?: string;
    fillColor?: string;
    style?: StyleProp<ViewStyle>;
    fillStyle?: StyleProp<ViewStyle>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    height = 8,
    trackColor,
    fillColor,
    style,
    fillStyle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const clamped = Math.max(0, Math.min(100, progress));
    const radius = height / 2;

    return (
        <View
            style={[
                styles.track,
                { height, borderRadius: radius, backgroundColor: trackColor ?? theme.border },
                style,
            ]}
        >
            <View
                style={[
                    styles.fill,
                    { width: `${clamped}%`, borderRadius: radius, backgroundColor: fillColor ?? theme.primary },
                    fillStyle,
                ]}
            />
        </View>
    );
};
