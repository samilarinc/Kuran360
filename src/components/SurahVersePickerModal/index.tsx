import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Modal, TouchableOpacity, ScrollView, SafeAreaView, TextInput, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { getSurahsList } from '@/data/quranData';
import { getSurahName } from '@/utils/surahName';
import { useTheme, useThemedStyles, Theme, CommonStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADIUS, SPACING } from '@/theme';

interface SurahVersePickerModalProps {
    visible: boolean;
    surahNumber: number;
    verseNumber: number;
    onSelect: (surahNumber: number, verseNumber: number) => void;
    onClose: () => void;
}

const BADGE_SIZE = 36;
const CELL_SIZE = 46;

/** Two steps in one modal: a searchable surah list, then a grid of that surah's verse numbers. */
export const SurahVersePickerModal: React.FC<SurahVersePickerModalProps> = ({
    visible,
    surahNumber,
    verseNumber,
    onSelect,
    onClose,
}) => {
    const { t } = useTranslation();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const surahs = getSurahsList();
    const [pickedSurah, setPickedSurah] = useState<number | null>(surahNumber);
    const [search, setSearch] = useState('');

    // Opens on the verses of the current surah, since changing only the verse is the common case
    useEffect(() => {
        if (visible) {
            setPickedSurah(surahNumber);
            setSearch('');
        }
    }, [visible, surahNumber]);

    const surah = pickedSurah ? surahs.find(s => s.number === pickedSurah) : null;
    const query = search.trim().toLocaleLowerCase('tr');
    const filtered = surahs.filter(s => !query || String(s.number).startsWith(query) || getSurahName(t, s).toLocaleLowerCase('tr').includes(query));

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={common.pickerOverlay}>
                <SafeAreaView style={common.modalContainerCentered}>
                    <View style={common.pickerHeader}>
                        {surah ? (
                            <TouchableOpacity style={styles.backButton} onPress={() => setPickedSurah(null)} accessibilityLabel={t('memorization.picker.back')}>
                                <ChevronLeft size={22} color={theme.primary} />
                                <Text style={common.pickerHeaderTitle}>{surah.number}. {getSurahName(t, surah)}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={common.pickerHeaderTitle}>{t('memorization.picker.surahTitle')}</Text>
                        )}
                        <TouchableOpacity onPress={onClose} style={common.pickerCloseButton}>
                            <Text style={common.pickerCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {surah ? (
                        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
                            {Array.from({ length: surah.verseCount }, (_, i) => i + 1).map(verse => {
                                const selected = surah.number === surahNumber && verse === verseNumber;
                                return (
                                    <TouchableOpacity
                                        key={verse}
                                        style={[styles.cell, selected && common.selected]}
                                        onPress={() => {
                                            onSelect(surah.number, verse);
                                            onClose();
                                        }}
                                    >
                                        <Text style={[styles.cellText, selected && common.buttonTextPrimary]}>{verse}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <>
                            <View style={common.pickerSearchContainer}>
                                <View style={common.pickerSearchInputContainer}>
                                    <TextInput
                                        style={common.pickerSearchInput}
                                        value={search}
                                        onChangeText={setSearch}
                                        placeholder={t('memorization.picker.searchPlaceholder')}
                                        placeholderTextColor={theme.textSecondary}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    {search ? (
                                        <TouchableOpacity onPress={() => setSearch('')} style={common.pickerClearButton}>
                                            <Text style={common.smallText}>✕</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                            <ScrollView style={common.pickerList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {filtered.map(s => (
                                    <TouchableOpacity
                                        key={s.number}
                                        style={[common.pickerOption, styles.surahRow, s.number === surahNumber && common.pickerOptionSelected]}
                                        onPress={() => setPickedSurah(s.number)}
                                    >
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{s.number}</Text>
                                        </View>
                                        <View style={common.flex1}>
                                            <Text style={common.textStrong}>{getSurahName(t, s)}</Text>
                                            <Text style={common.smallText}>{t('memorization.picker.verseCount', { count: s.verseCount })}</Text>
                                        </View>
                                        <Text style={styles.arabicName}>{s.arabicName}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
        backButton: {
            ...common.row,
            gap: SPACING.xs,
        },
        surahRow: {
            ...common.row,
            gap: SPACING.md,
        },
        badge: {
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            borderRadius: BADGE_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primary + '20',
        },
        badgeText: {
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
            color: theme.primary,
        },
        arabicName: {
            ...common.arabicText,
            fontSize: FONT_SIZES.large,
            lineHeight: FONT_SIZES.large * 1.5,
        },
        grid: {
            ...common.rowWrap,
            gap: SPACING.sm,
            padding: SPACING.md,
        },
        cell: {
            width: CELL_SIZE,
            height: CELL_SIZE,
            borderRadius: RADIUS.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
        },
        cellText: {
            fontSize: FONT_SIZES.medium,
            fontWeight: '500',
            color: theme.text,
        },
    });
};
