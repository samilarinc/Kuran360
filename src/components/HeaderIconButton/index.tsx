import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const BUTTON_SIZE = 36;

interface HeaderIconButtonProps {
    icon: LucideIcon;
    accessibilityLabel: string;
    onPress: () => void;
}

/**
 * Round header button with the same look as the theme/language toggles.
 * Whatever it opens (a modal) must be mounted outside HeaderMenu: on narrow screens these buttons
 * live inside the slide-down menu, and a modal mounted there doesn't receive touches.
 */
export const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({ icon: Icon, accessibilityLabel, onPress }) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
            <Icon size={18} color={theme.primary} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
