import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, SafeAreaView, TextInput, StyleSheet } from 'react-native';
import { Verse as VerseType } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles, Theme, CommonStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '@/theme';

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
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
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
            <View style={common.pickerOverlay}>
                <SafeAreaView style={common.modalContainerCentered}>
                    {/* Header */}
                    <View style={common.pickerHeader}>
                        <Text style={common.pickerHeaderTitle}>Ayete Git</Text>
                        <TouchableOpacity onPress={onClose} style={common.pickerCloseButton}>
                            <Text style={common.pickerCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={common.pickerSearchContainer}>
                        <Text style={[common.smallText, common.mbXs]}>Ayet numarası veya metin ara:</Text>
                        <View style={common.pickerSearchInputContainer}>
                            <TextInput
                                style={common.pickerSearchInput}
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
                                    style={common.pickerClearButton}
                                >
                                    <Text style={common.smallText}>✕</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Verse List */}
                    <ScrollView style={common.pickerList} showsVerticalScrollIndicator={false}>
                        {filteredVerses.map((verse) => {
                            const actualIndex = verses.indexOf(verse);
                            const isCurrentVerse = actualIndex === currentVerseIndex;
                            const translationPreview = getTranslationPreview(getPreferredTranslation(verse));

                            return (
                                <TouchableOpacity
                                    key={verse.id}
                                    style={[
                                        common.pickerOption,
                                        isCurrentVerse && common.pickerOptionSelected
                                    ]}
                                    onPress={() => handleVerseSelect(actualIndex)}
                                >
                                    <View style={[common.rowBetween, common.mbXs]}>
                                        <Text style={[
                                            common.textAccent,
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

const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
    currentLabel: {
        ...common.badge,
        ...common.badgeText,
        color: theme.primary,
        fontWeight: '500',
        backgroundColor: theme.primary + '20',
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    versePreview: {
        ...common.smallText,
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
};
