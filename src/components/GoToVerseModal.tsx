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
import { useTheme, Theme } from '../contexts/ThemeContext';

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
    const { theme } = useTheme();
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
            <View style={createStyles(theme).overlay}>
                <SafeAreaView style={createStyles(theme).modalContainer}>
                    {/* Header */}
                    <View style={createStyles(theme).header}>
                        <Text style={createStyles(theme).title}>Ayete Git</Text>
                        <TouchableOpacity onPress={onClose} style={createStyles(theme).closeButton}>
                            <Text style={createStyles(theme).closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={createStyles(theme).searchContainer}>
                        <Text style={createStyles(theme).searchLabel}>Ayet numarası veya metin ara:</Text>
                        <View style={createStyles(theme).searchInputContainer}>
                            <TextInput
                                style={createStyles(theme).searchInput}
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
                                    style={createStyles(theme).clearButton}
                                >
                                    <Text style={createStyles(theme).clearButtonText}>✕</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Verse List */}
                    <ScrollView style={createStyles(theme).verseList} showsVerticalScrollIndicator={false}>
                        {filteredVerses.map((verse, index) => {
                            const actualIndex = verses.indexOf(verse);
                            const isCurrentVerse = actualIndex === currentVerseIndex;
                            const translationPreview = getTranslationPreview(getPreferredTranslation(verse));

                            return (
                                <TouchableOpacity
                                    key={verse.id}
                                    style={[
                                        createStyles(theme).verseItem,
                                        isCurrentVerse && createStyles(theme).currentVerseItem
                                    ]}
                                    onPress={() => handleVerseSelect(actualIndex)}
                                >
                                    <View style={createStyles(theme).verseHeader}>
                                        <Text style={[
                                            createStyles(theme).verseNumber,
                                            isCurrentVerse && createStyles(theme).currentVerseNumber
                                        ]}>
                                            Ayet {verse.number}
                                        </Text>
                                        {isCurrentVerse && (
                                            <Text style={createStyles(theme).currentLabel}>Şu anki</Text>
                                        )}
                                    </View>
                                    <Text style={[
                                        createStyles(theme).versePreview,
                                        isCurrentVerse && createStyles(theme).currentVersePreview
                                    ]}>
                                        {translationPreview}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Quick navigation buttons */}
                    <View style={createStyles(theme).quickNavContainer}>
                        <TouchableOpacity
                            style={createStyles(theme).quickNavButton}
                            onPress={() => handleVerseSelect(0)}
                        >
                            <Text style={createStyles(theme).quickNavText}>İlk Ayet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={createStyles(theme).quickNavButton}
                            onPress={() => handleVerseSelect(Math.floor(verses.length / 2))}
                        >
                            <Text style={createStyles(theme).quickNavText}>Orta</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={createStyles(theme).quickNavButton}
                            onPress={() => handleVerseSelect(verses.length - 1)}
                        >
                            <Text style={createStyles(theme).quickNavText}>Son Ayet</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: theme.cardBackground,
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
        borderBottomColor: theme.background,
    },
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.primary,
    },
    closeButton: {
        padding: SPACING.xs,
        borderRadius: 4,
    },
    closeButtonText: {
        fontSize: FONT_SIZES.large,
        color: theme.textSecondary,
        fontWeight: 'bold',
    },
    searchContainer: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.background,
    },
    searchLabel: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        marginBottom: SPACING.xs,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.textSecondary + '40',
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.sm,
        backgroundColor: theme.background,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZES.medium,
        color: theme.text,
        paddingVertical: Platform.OS === 'ios' ? SPACING.xs : 0,
    },
    clearButton: {
        padding: SPACING.xs,
    },
    clearButtonText: {
        color: theme.textSecondary,
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
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    currentVerseItem: {
        backgroundColor: theme.primary + '10',
        borderColor: theme.primary + '30',
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
        color: theme.primary,
    },
    currentVerseNumber: {
        color: theme.primary,
        fontWeight: 'bold',
    },
    currentLabel: {
        fontSize: FONT_SIZES.small,
        color: theme.primary,
        fontWeight: '500',
        backgroundColor: theme.primary + '20',
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    versePreview: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        lineHeight: 18,
    },
    currentVersePreview: {
        color: theme.text,
    },
    quickNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: theme.background,
    },
    quickNavButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: theme.primary + '20',
        borderRadius: 6,
        minWidth: 70,
        alignItems: 'center',
    },
    quickNavText: {
        fontSize: FONT_SIZES.small,
        color: theme.primary,
        fontWeight: '500',
    },
});
