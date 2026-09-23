import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';

export interface CityOption {
    name: string;
    code: string;
}

interface CityPickerModalProps {
    visible: boolean;
    title: string;
    cities: CityOption[];
    onSelect: (city: CityOption) => void;
    onClose: () => void;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
    visible,
    title,
    cities,
    onSelect,
    onClose,
}) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={common.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <Text style={[common.modalTitle, common.mbMd]}>{title}</Text>
                    {cities.map((city) => (
                        <TouchableOpacity key={city.code} style={styles.modalOption} onPress={() => onSelect(city)}>
                            <Text style={[common.text, common.textCenter]}>{city.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 12,
        padding: SPACING.lg,
        maxHeight: '80%',
        backgroundColor: theme.surface,
    },
    modalOption: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
});
