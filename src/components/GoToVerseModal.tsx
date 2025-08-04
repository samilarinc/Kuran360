import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Dimensions,
    TextInput,
    Platform,
} from 'react-native';
import { Verse as VerseType } from '../types';
import { COLORS, FONT_SIZES, SPACING } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    const [searchText, setSearchText] = useState('');

    // Get the user's preferred translation
    const getPreferredTranslation = (verse: VerseType): string => {
        if (settings.selectedTranslations.length > 0 && verse.allTranslations) {
            const preferredTranslation = settings.selectedTranslations[0];
            return verse.allTranslations[preferredTranslation] || verse.translation;
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
        const translation = getPreferredTranslation(verse).toLowerCase();
        const search = searchText.toLowerCase();

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
                                placeholderTextColor={COLORS.textSecondary}
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        width: Math.min(screenWidth * 0.9, 400),
        maxHeight: screenHeight * 0.8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    closeButton: {
        padding: SPACING.xs,
        borderRadius: 4,
    },
    closeButtonText: {
        fontSize: FONT_SIZES.large,
        color: COLORS.textSecondary,
        fontWeight: 'bold',
    },
    searchContainer: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    searchLabel: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.textSecondary + '40',
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.background,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZES.medium,
        color: COLORS.text,
        paddingVertical: Platform.OS === 'ios' ? SPACING.xs : 0,
    },
    clearButton: {
        padding: SPACING.xs,
    },
    clearButtonText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.small,
    },
    verseList: {
        flex: 1,
        padding: SPACING.sm,
    },
    verseItem: {
        padding: SPACING.md,
        marginVertical: SPACING.xs,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    currentVerseItem: {
        backgroundColor: COLORS.primary + '10',
        borderColor: COLORS.primary + '30',
    },
    verseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    verseNumber: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: COLORS.primary,
    },
    currentVerseNumber: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    currentLabel: {
        fontSize: FONT_SIZES.small,
        color: COLORS.primary,
        fontWeight: '500',
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    versePreview: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    currentVersePreview: {
        color: COLORS.text,
    },
    quickNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.background,
    },
    quickNavButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.primary + '20',
        borderRadius: 6,
        minWidth: 70,
        alignItems: 'center',
    },
    quickNavText: {
        fontSize: FONT_SIZES.small,
        color: COLORS.primary,
        fontWeight: '500',
    },
});
