import React from 'react';
import { View, Text, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingViewProps {
    text?: string;
    note?: string;
    color?: string;
    style?: StyleProp<ViewStyle>;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ text, note, color, style }) => {
    const { theme, common } = useTheme();

    return (
        <View style={[common.centerFill, common.gapMd, style]}>
            <ActivityIndicator size="large" color={color ?? theme.primary} />
            {text && <Text style={common.subtitle}>{text}</Text>}
            {note && <Text style={common.smallText}>{note}</Text>}
        </View>
    );
};
