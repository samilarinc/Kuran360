import React from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, StyleProp, ViewStyle, TextStyle, TextInputProps, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

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
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <View style={[styles.container, style]}>
            {icon && <Ionicons name="search" size={20} color={theme.textSecondary} />}
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
                <ActivityIndicator color={theme.primary} />
            ) : (
                onClear && value.length > 0 && (
                    <TouchableOpacity style={styles.clearButton} onPress={onClear}>
                        <Text style={common.subtitle}>✕</Text>
                    </TouchableOpacity>
                )
            )}
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
        borderRadius: 10,
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: theme.border,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: FONT_SIZES.medium,
        color: theme.text,
    },
    clearButton: {
        padding: SPACING.xs,
    },
});
