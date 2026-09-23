import React, { useState } from 'react';
import { Animated, Switch, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Theme, SPACING } from '@/theme';
import { useThemedStyles } from '@/contexts/ThemeContext';

interface ModernSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    theme: Theme;
}

export const ModernSwitch: React.FC<ModernSwitchProps> = ({
    value,
    onValueChange,
    disabled = false,
    theme
}) => {
    const styles = useThemedStyles(createStyles);
    const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

    React.useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value, animatedValue]);

    const handlePress = () => {
        if (!disabled) {
            onValueChange(!value);
        }
    };

    const trackColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [
            disabled ? 'rgba(128, 128, 128, 0.25)' : 'rgba(128, 128, 128, 0.5)',
            disabled ? 'rgba(86, 163, 90, 0.38)' : theme.primary
        ],
    });

    const thumbTranslate = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22],
    });

    const thumbScale = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });

    if (Platform.OS === 'web') {
        return (
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{
                    false: disabled ? theme.border + '40' : theme.border + '60',
                    true: disabled ? theme.primary + '60' : theme.primary
                }}
                thumbColor={value ? '#FFFFFF' : theme.text}
                disabled={disabled}
                style={styles.webSwitch}
            />
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            disabled={disabled}
            style={styles.modernSwitchContainer}
        >
            <Animated.View
                style={[
                    styles.modernSwitchTrack,
                    { backgroundColor: trackColor },
                    disabled && styles.modernSwitchDisabled
                ]}
            >
                <Animated.View
                    style={[
                        styles.modernSwitchThumb,
                        {
                            transform: [
                                { translateX: thumbTranslate },
                                { scale: thumbScale }
                            ]
                        },
                        value && styles.modernSwitchThumbActive
                    ]}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const createStyles = (_theme: Theme) => StyleSheet.create({
    webSwitch: {
        transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
        marginLeft: SPACING.sm,
    },
    modernSwitchContainer: {
        padding: SPACING.xs,
    },
    modernSwitchTrack: {
        width: 48,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    modernSwitchDisabled: {
        opacity: 0.6,
    },
    modernSwitchThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    modernSwitchThumbActive: {
        backgroundColor: '#FFFFFF',
    },
});
