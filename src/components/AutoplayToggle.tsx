import React, { useRef, useEffect, useMemo } from 'react';
import {
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebouncedToggle } from '@/hooks/useDebouncedState';
import { createStyles } from './AutoplayToggle.styles';

interface AutoplayToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const AutoplayToggle: React.FC<AutoplayToggleProps> = ({
    isEnabled,
    onToggle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
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
                        styles.knobWhite,
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
