import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING } from '../constants';

interface AudioTrackingToggleProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const AudioTrackingToggle: React.FC<AudioTrackingToggleProps> = ({
    isEnabled,
    onToggle,
}) => {
    const { theme } = useTheme();

    const handlePress = () => {
        onToggle(!isEnabled);
    };

    return (
        <TouchableOpacity 
            onPress={handlePress} 
            activeOpacity={0.7}
            style={[
                styles.container, 
                { 
                    backgroundColor: isEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    borderColor: isEnabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'
                }
            ]}
        >
            <Text style={[styles.icon, { color: theme.headerText }]}>
                {isEnabled ? '👁️' : '👁️‍🗨️'}
            </Text>
            <Text style={[styles.label, { color: theme.headerText }]}>
                {isEnabled ? 'Açık' : 'Kapalı'}
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
