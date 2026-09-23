import React from 'react';
import { View, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { Theme } from '@/theme';

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
    const styles = useThemedStyles(createStyles);
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

const createStyles = (_theme: Theme) => StyleSheet.create({
    track: {
        width: '100%',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
    },
});
