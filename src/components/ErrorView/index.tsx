import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AppButton } from '../AppButton';

type ErrorViewProps = {
    text: string;
    style?: StyleProp<ViewStyle>;
} & (
    | { onRetry?: undefined; retryText?: undefined }
    | { onRetry: () => void; retryText: string }
);

export const ErrorView: React.FC<ErrorViewProps> = ({ text, retryText, onRetry, style }) => {
    const { common } = useTheme();

    return (
        <View style={[common.centerFill, common.gapLg, common.pLg, style]}>
            <Text style={[common.textLarge, common.textCenter]}>{text}</Text>
            {onRetry && (
                <AppButton title={retryText} onPress={onRetry} variant="primary" />
            )}
        </View>
    );
};
