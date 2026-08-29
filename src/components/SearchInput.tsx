import React, { useMemo } from 'react';
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    TextStyle,
    TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './SearchInput.styles';

interface SearchInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon?: boolean;
    onClear?: () => void;
    loading?: boolean;
    autoFocus?: boolean;
    returnKeyType?: TextInputProps['returnKeyType'];
    autoCorrect?: boolean;
    autoCapitalize?: TextInputProps['autoCapitalize'];
    onFocus?: () => void;
    onBlur?: () => void;
    placeholderColor?: string;
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChangeText,
    placeholder,
    icon = false,
    onClear,
    loading = false,
    autoFocus,
    returnKeyType,
    autoCorrect,
    autoCapitalize,
    onFocus,
    onBlur,
    placeholderColor,
    style,
    inputStyle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={[styles.container, style]}>
            {icon && <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.icon} />}
            <TextInput
                style={[styles.input, inputStyle]}
                placeholder={placeholder}
                placeholderTextColor={placeholderColor ?? theme.textSecondary}
                value={value}
                onChangeText={onChangeText}
                autoFocus={autoFocus}
                returnKeyType={returnKeyType}
                autoCorrect={autoCorrect}
                autoCapitalize={autoCapitalize}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {loading ? (
                <ActivityIndicator style={styles.trailing} color={theme.primary} />
            ) : (
                onClear && value.length > 0 && (
                    <TouchableOpacity style={styles.clearButton} onPress={onClear}>
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )
            )}
        </View>
    );
};
