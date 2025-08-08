import React from 'react';
import {
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useDebouncedToggle } from '../hooks/useDebouncedState';

interface AudioTrackingToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const AudioTrackingToggle: React.FC<AudioTrackingToggleProps> = ({
    isEnabled,
    onToggle,
}) => {
    const { theme } = useTheme();
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
                {
                    backgroundColor: displayState ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    borderColor: displayState ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'
                }
            ]}
        >
            <Text style={[styles.icon, { color: theme.headerText }]}>
                {displayState ? '👁️' : '👁️‍🗨️'}
            </Text>
            <Text style={[styles.label, { color: theme.headerText }]}>
                {displayState ? 'Açık' : 'Kapalı'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 60,
    },
    icon: {
        fontSize: 16,
        marginBottom: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
    },
});
