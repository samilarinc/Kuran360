import React, { useMemo } from 'react';
import {
    Text,
    TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useDebouncedToggle } from '../hooks/useDebouncedState';
import { createStyles } from './AudioTrackingToggle.styles';

interface AudioTrackingToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const AudioTrackingToggle: React.FC<AudioTrackingToggleProps> = ({
    isEnabled,
    onToggle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { isEnabled: displayState, toggle } = useDebouncedToggle(
        isEnabled,
        onToggle,
        200 // 200ms debounce
    );

    return (
        <TouchableOpacity
            onPress={toggle}
            activeOpacity={0.7}
            style={[
                styles.container,
                displayState ? styles.toggleActive : styles.toggleInactive,
            ]}
        >
            <Text style={styles.icon}>
                {displayState ? '👁️' : '👁️‍🗨️'}
            </Text>
            <Text style={styles.label}>
                {displayState ? 'Açık' : 'Kapalı'}
            </Text>
        </TouchableOpacity>
    );
};
