import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Speech } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ReciterPickerModal } from '@/components/ReciterPickerModal';

const BUTTON_SIZE = 36;

/** Round header button (same look as the theme/language toggles) that opens the reciter picker. */
export const HeaderReciterButton: React.FC = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    return (
        <>
            <TouchableOpacity
                accessibilityLabel={t('reciterSelector.title')}
                onPress={() => setVisible(true)}
                style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
                <Speech size={18} color={theme.primary} />
            </TouchableOpacity>
            <ReciterPickerModal visible={visible} onClose={() => setVisible(false)} />
        </>
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
