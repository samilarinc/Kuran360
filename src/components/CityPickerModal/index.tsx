import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    {cities.map((city) => (
                        <TouchableOpacity key={city.code} style={styles.modalOption} onPress={() => onSelect(city)}>
                            <Text style={styles.modalOptionText}>{city.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};
