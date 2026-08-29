import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './LoadingView.styles';

interface LoadingViewProps {
    text?: string;
    note?: string;
    color?: string;
    style?: StyleProp<ViewStyle>;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ text, note, color, style }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator size="large" color={color ?? theme.primary} />
            {text && <Text style={styles.text}>{text}</Text>}
            {note && <Text style={styles.note}>{note}</Text>}
        </View>
    );
};
