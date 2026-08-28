import React, { useMemo } from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AppButton } from './AppButton';
import { createStyles } from './ErrorView.styles';

type ErrorViewProps = {
    text: string;
    style?: StyleProp<ViewStyle>;
} & (
    | { onRetry?: undefined; retryText?: undefined }
    | { onRetry: () => void; retryText: string }
);

export const ErrorView: React.FC<ErrorViewProps> = ({ text, retryText, onRetry, style }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.text}>{text}</Text>
            {onRetry && (
                <AppButton title={retryText} onPress={onRetry} variant="primary" />
            )}
        </View>
    );
};
