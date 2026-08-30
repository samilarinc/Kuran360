import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles, webDateInputStyle } from './index.styles';

interface DateFieldProps {
    label: string;
    displayText: string;
    isFilled: boolean;
    inputValue: string;
    minInput?: string;
    maxInput?: string;
    onChangeWeb: (event: any) => void;
    onPress: () => void;
}

export const DateField: React.FC<DateFieldProps> = ({
    label,
    displayText,
    isFilled,
    inputValue,
    minInput,
    maxInput,
    onChangeWeb,
    onPress,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    return (
        <View style={styles.compactDateRow}>
            <Text style={styles.compactDateLabel}>{label}</Text>
            {Platform.OS === 'web' ? (
                <View style={styles.webDateInputWrapper}>
                    <Text style={[styles.compactDateText, isFilled ? styles.compactDateTextFilled : styles.compactDateTextPlaceholder]}>
                        {displayText}
                    </Text>
                    <input
                        type="date"
                        value={inputValue}
                        onChange={onChangeWeb}
                        min={minInput}
                        max={maxInput}
                        style={webDateInputStyle}
                    />
                </View>
            ) : (
                <TouchableOpacity
                    style={common.flex1}
                    onPress={onPress}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.compactDateText, isFilled ? styles.compactDateTextFilled : styles.compactDateTextPlaceholder]}>
                        {displayText}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
