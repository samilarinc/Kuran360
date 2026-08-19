import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { ShareModal } from '../components/ShareModal';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { getSurahsList } from '../data/quranData';
import { Verse as VerseType, VerseShareData } from '../types';
import { getSurahName as getLocalizedSurahName } from '../utils/surahName';
import { createStyles } from './AllTranslationsScreen.styles';

interface AllTranslationsScreenProps {
    navigation: any;
    route: {
        params: {
            verse: VerseType;
        };
    };
}

export const AllTranslationsScreen: React.FC<AllTranslationsScreenProps> = ({ navigation, route }) => {
    const { verse } = route.params;
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { settings: debouncedSettings, updateSettings } = useDebouncedSettings(200);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedTranslation, setSelectedTranslation] = useState<string>(debouncedSettings.favoriteTranslation);

    // Surah ismini al
    const getSurahName = () => {
        const surahs = getSurahsList();
        const surah = surahs.find(s => s.number === verse.surahNumber);
        return surah ? getLocalizedSurahName(t, surah) : `${verse.surahNumber}`;
    };

    // Mevcut olan tüm mealleri al
    const availableTranslations = useMemo(() => {
        if (!verse.allTranslations) return [];

        // Önce favori meali, sonra alfabetik sıralama
        const translations = Object.entries(verse.allTranslations);
        return translations.sort(([nameA], [nameB]) => {
            if (nameA === debouncedSettings.favoriteTranslation) return -1;
            if (nameB === debouncedSettings.favoriteTranslation) return 1;
            return nameA.localeCompare(nameB, 'tr');
        });
    }, [verse.allTranslations, debouncedSettings.favoriteTranslation]);

    // Seçilen meal ile share data oluştur
    const shareData: VerseShareData = useMemo(() => {
        const surahName = getSurahName();
        const translation = verse.allTranslations?.[selectedTranslation] || verse.translation || '';

        return {
            arabicText: verse.arabicText,
            translation: translation,
            surahName: surahName,
            verseNumber: verse.number,
            surahNumber: verse.surahNumber,
        };
    }, [verse, selectedTranslation]);

    const handleShare = (translationName: string) => {
        setSelectedTranslation(translationName);
        setShareModalVisible(true);
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    if (availableTranslations.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <HeaderWithDarkModeToggle
                    title={t('screenTitles.allTranslations')}
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                    showHomeButton={true}
                    onHomePress={() => navigation.navigate('Main')}
                />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                        {t('allTranslationsScreen.noTranslationsFound')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <HeaderWithDarkModeToggle
                title={t('screenTitles.allTranslations')}
                subtitle={t('allTranslationsScreen.verseSubtitle', { surahName: getSurahName(), verseNumber: verse.number })}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Ayet Header */}
                <View style={styles.verseHeader}>
                    <Text style={styles.arabicText}>
                        {verse.arabicText}
                    </Text>
                    <View style={styles.verseInfo}>
                        <Text style={styles.surahInfo}>
                            {getSurahName()}
                        </Text>
                        <Text style={styles.verseNumber}>
                            {t('allTranslationsScreen.verseBadge', { verseNumber: verse.number })}
                        </Text>
                    </View>
                </View>

                {/* Meal Listesi */}
                <View style={styles.translationsContainer}>
                    {availableTranslations.map(([translationName, translationText]) => {
                        const isFavorite = translationName === debouncedSettings.favoriteTranslation;

                        return (
                            <View
                                key={translationName}
                                style={[
                                    styles.translationItem,
                                    isFavorite && styles.favoriteTranslationItem
                                ]}
                            >
                                <View style={styles.translationHeader}>
                                    <Text style={[
                                        styles.translationName,
                                        isFavorite && styles.favoriteTranslationName
                                    ]}>
                                        {isFavorite && '⭐ '}{translationName}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.shareButton}
                                        onPress={() => handleShare(translationName)}
                                    >
                                        <Text style={styles.shareButtonText}>{t('allTranslationsScreen.share')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={[
                                    styles.translationText,
                                    isFavorite && styles.favoriteTranslationText
                                ]}>
                                    {translationText}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Share Modal */}
            <ShareModal
                isVisible={shareModalVisible}
                onClose={() => setShareModalVisible(false)}
                verseData={shareData}
            />
        </SafeAreaView>
    );
};