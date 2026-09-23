import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { useDebouncedToggle } from '@/hooks/useDebouncedState';
import { Theme } from '@/theme';

interface AudioTrackingToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const AudioTrackingToggle: React.FC<AudioTrackingToggleProps> = ({
    isEnabled,
    onToggle,
}) => {
    const styles = useThemedStyles(createStyles);
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

const createStyles = (theme: Theme) => StyleSheet.create({
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
        color: theme.headerText,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: theme.headerText,
    },
    toggleActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    toggleInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
});
