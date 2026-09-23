import React, { useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

export interface TranslationPickerOption {
    id: string;
    label: string;
}

interface TranslationPickerModalProps {
    visible: boolean;
    title: string;
    options: TranslationPickerOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}

export const TranslationPickerModal: React.FC<TranslationPickerModalProps> = ({
    visible,
    title,
    options,
    selectedId,
    onSelect,
    onClose,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const [searchText, setSearchText] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchText) return options;
        const search = searchText.toLocaleLowerCase('tr');
        return options.filter(o => o.label.toLocaleLowerCase('tr').includes(search));
    }, [options, searchText]);

    const handleSelect = (id: string) => {
        onSelect(id);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={common.pickerOverlay}>
                <SafeAreaView style={common.modalContainerCentered}>
                    <View style={common.pickerHeader}>
                        <Text style={common.pickerHeaderTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={common.pickerCloseButton}>
                            <Text style={common.pickerCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={common.pickerSearchContainer}>
                        <View style={common.pickerSearchInputContainer}>
                            <TextInput
                                style={common.pickerSearchInput}
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder={t('quranPageScreen.searchTranslation')}
                                placeholderTextColor={theme.textSecondary}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchText ? (
                                <TouchableOpacity onPress={() => setSearchText('')} style={common.pickerClearButton}>
                                    <Text style={common.smallText}>✕</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    <ScrollView style={common.pickerList} showsVerticalScrollIndicator={false}>
                        {filteredOptions.map(option => {
                            const isSelected = option.id === selectedId;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[common.pickerOption, common.rowBetween, common.gapSm, isSelected && common.pickerOptionSelected]}
                                    onPress={() => handleSelect(option.id)}
                                >
                                    <Text style={[common.text, common.flex1, isSelected && common.textAccent]}>
                                        {option.label}
                                    </Text>
                                    {isSelected && <Text style={common.textAccent}>✓</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};
