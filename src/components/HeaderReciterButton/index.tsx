import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Speech } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const BUTTON_SIZE = 36;

interface HeaderReciterButtonProps {
    onPress: () => void;
}

/**
 * Round header button (same look as the theme/language toggles) that opens the reciter picker.
 * The picker modal itself is owned by AppHeader: on narrow screens this button lives inside the
 * slide-down HeaderMenu, and a modal mounted there doesn't receive touches (they fall through).
 */
export const HeaderReciterButton: React.FC<HeaderReciterButtonProps> = ({ onPress }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <TouchableOpacity
            accessibilityLabel={t('reciterSelector.title')}
            onPress={onPress}
            style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
            <Speech size={18} color={theme.primary} />
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
