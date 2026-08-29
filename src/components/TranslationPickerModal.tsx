import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './TranslationPickerModal.styles';

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
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
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
            <View style={styles.overlay}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <TextInput
                                style={styles.searchInput}
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder={t('quranPageScreen.searchTranslation')}
                                placeholderTextColor={theme.textSecondary}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchText ? (
                                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                                    <Text style={styles.clearButtonText}>✕</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    <ScrollView style={styles.optionList} showsVerticalScrollIndicator={false}>
                        {filteredOptions.map(option => {
                            const isSelected = option.id === selectedId;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                                    onPress={() => handleSelect(option.id)}
                                >
                                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                                        {option.label}
                                    </Text>
                                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};
