import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    TextInput,
} from 'react-native';
import { Verse as VerseType } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './GoToVerseModal.styles';

interface GoToVerseModalProps {
    visible: boolean;
    verses: VerseType[];
    currentVerseIndex: number;
    onVerseSelect: (verseIndex: number) => void;
    onClose: () => void;
}

export const GoToVerseModal: React.FC<GoToVerseModalProps> = ({
    visible,
    verses,
    currentVerseIndex,
    onVerseSelect,
    onClose,
}) => {
    const { settings } = useSettings();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [searchText, setSearchText] = useState('');

    // Get the user's preferred translation
    const getPreferredTranslation = (verse: VerseType): string => {
        if (verse.allTranslations && settings.favoriteTranslation) {
            return verse.allTranslations[settings.favoriteTranslation] || verse.translation;
        }
        return verse.translation;
    };

    // Truncate translation text for preview
    const getTranslationPreview = (text: string): string => {
        if (text.length <= 60) return text;
        return text.substring(0, 60) + '...';
    };

    // Filter verses based on search text (verse number or translation content)
    const filteredVerses = verses.filter((verse, index) => {
        if (!searchText) return true;

        const verseNumber = (index + 1).toString();
        const translation = getPreferredTranslation(verse).toLocaleLowerCase('tr');
        const search = searchText.toLocaleLowerCase('tr');

        return verseNumber.includes(search) || translation.includes(search);
    });

    const handleVerseSelect = (verseIndex: number) => {
        onVerseSelect(verseIndex);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Ayete Git</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <Text style={styles.searchLabel}>Ayet numarası veya metin ara:</Text>
                        <View style={styles.searchInputContainer}>
                            <TextInput
                                style={styles.searchInput}
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder="Ayet numarası veya metin girin..."
                                placeholderTextColor={theme.textSecondary}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchText ? (
                                <TouchableOpacity
                                    onPress={() => setSearchText('')}
                                    style={styles.clearButton}
                                >
                                    <Text style={styles.clearButtonText}>✕</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Verse List */}
                    <ScrollView style={styles.verseList} showsVerticalScrollIndicator={false}>
                        {filteredVerses.map((verse, index) => {
                            const actualIndex = verses.indexOf(verse);
                            const isCurrentVerse = actualIndex === currentVerseIndex;
                            const translationPreview = getTranslationPreview(getPreferredTranslation(verse));

                            return (
                                <TouchableOpacity
                                    key={verse.id}
                                    style={[
                                        styles.verseItem,
                                        isCurrentVerse && styles.currentVerseItem
                                    ]}
                                    onPress={() => handleVerseSelect(actualIndex)}
                                >
                                    <View style={styles.verseHeader}>
                                        <Text style={[
                                            styles.verseNumber,
                                            isCurrentVerse && styles.currentVerseNumber
                                        ]}>
                                            Ayet {verse.number}
                                        </Text>
                                        {isCurrentVerse && (
                                            <Text style={styles.currentLabel}>Şu anki</Text>
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.versePreview,
                                        isCurrentVerse && styles.currentVersePreview
                                    ]}>
                                        {translationPreview}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Quick navigation buttons */}
                    <View style={styles.quickNavContainer}>
                        <TouchableOpacity
                            style={styles.quickNavButton}
                            onPress={() => handleVerseSelect(0)}
                        >
                            <Text style={styles.quickNavText}>İlk Ayet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickNavButton}
                            onPress={() => handleVerseSelect(Math.floor(verses.length / 2))}
                        >
                            <Text style={styles.quickNavText}>Orta</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickNavButton}
                            onPress={() => handleVerseSelect(verses.length - 1)}
                        >
                            <Text style={styles.quickNavText}>Son Ayet</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};
