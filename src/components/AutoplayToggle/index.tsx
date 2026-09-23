import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { SHADOW } from '@msarinc/ui';
import { Play, Pause } from 'lucide-react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useDebouncedToggle } from '@/hooks/useDebouncedState';
import { Theme } from '@/theme';

interface AutoplayToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const AutoplayToggle: React.FC<AutoplayToggleProps> = ({
    isEnabled,
    onToggle,
}) => {
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const slideAnimation = useRef(new Animated.Value(isEnabled ? 1 : 0)).current;
    const { isEnabled: displayState, toggle } = useDebouncedToggle(
        isEnabled,
        onToggle,
        200 // 200ms debounce
    );

    useEffect(() => {
        // Animate based on the display state for immediate visual feedback
        Animated.timing(slideAnimation, {
            toValue: displayState ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [displayState, slideAnimation]);

    const switchWidth = 60;
    const knobSize = 24;
    const translateX = slideAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [2, switchWidth - knobSize - 2],
    });

    const backgroundColor = slideAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(128, 128, 128, 0.5)', theme.primary],
    });

    return (
        <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
            <Animated.View style={[styles.container, { backgroundColor }]}>
                <Animated.View
                    style={[
                        styles.knob,
                        {
                            transform: [{ translateX }],
                        }
                    ]}
                >
                    {displayState ? (
                        <Play size={13} color={theme.primary} fill={theme.primary} />
                    ) : (
                        <Pause size={13} color={theme.textSecondary} fill={theme.textSecondary} />
                    )}
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const createStyles = (_theme: Theme) => StyleSheet.create({
    container: {
        width: 60,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        position: 'relative',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    knob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        ...SHADOW.sm,
    },
});
