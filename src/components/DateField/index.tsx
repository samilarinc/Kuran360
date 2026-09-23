import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

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
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);

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

// Plain (non-RN) CSS object for the invisible web <input type="date"> overlay.
// Not run through StyleSheet.create since it uses DOM-only CSS properties
// (cursor, outline, appearance) that aren't valid React Native style keys.
export const webDateInputStyle: any = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
    border: 'none',
    outline: 'none',
    // @ts-ignore
    appearance: 'none',
};

const createStyles = (theme: Theme) => StyleSheet.create({
    compactDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingLeft: SPACING.xs,
    },
    compactDateLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.textSecondary,
    },
    compactDateText: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
    },
    compactDateTextFilled: {
        color: theme.primary,
    },
    compactDateTextPlaceholder: {
        color: theme.textSecondary,
    },
    webDateInputWrapper: {
        flex: 1,
        position: 'relative',
        height: 35,
        justifyContent: 'center',
    },
});
