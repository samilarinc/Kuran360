import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { ShareModal } from '../components/ShareModal';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { getSurahsList } from '../data/quranData';
import { Verse as VerseType, VerseShareData } from '../types';
import { FONT_SIZES, SPACING } from '../constants';

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
    const { settings } = useSettings();
    const { settings: debouncedSettings, updateSettings } = useDebouncedSettings(200);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedTranslation, setSelectedTranslation] = useState<string>(debouncedSettings.favoriteTranslation);

    // Surah ismini al
    const getSurahName = () => {
        const surahs = getSurahsList();
        const surah = surahs.find(s => s.number === verse.surahNumber);
        return surah?.turkishName || surah?.name || `${verse.surahNumber}. Sure`;
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

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        content: {
            flex: 1,
        },
        verseHeader: {
            backgroundColor: theme.cardBackground,
            padding: SPACING.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        arabicText: {
            fontSize: FONT_SIZES.arabic,
            lineHeight: FONT_SIZES.arabic * 1.5,
            textAlign: 'right',
            color: theme.text,
            fontWeight: '600',
            writingDirection: 'rtl',
            marginBottom: SPACING.sm,
            fontFamily: Platform.select({
                web: '"Scheherazade New", "Noto Naskh Arabic", Amiri, serif',
                default: undefined as any,
            }),
        },
        verseInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: SPACING.sm,
        },
        surahInfo: {
            fontSize: FONT_SIZES.medium,
            color: theme.textSecondary,
            fontWeight: '600',
        },
        verseNumber: {
            backgroundColor: theme.primary,
            color: theme.headerText,
            fontSize: FONT_SIZES.small,
            fontWeight: 'bold',
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            borderRadius: 12,
        },
        translationsContainer: {
            flex: 1,
        },
        translationItem: {
            backgroundColor: theme.cardBackground,
            marginHorizontal: SPACING.md,
            marginVertical: SPACING.xs,
            padding: SPACING.md,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: theme.primary,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
        favoriteTranslationItem: {
            backgroundColor: '#FFD700' + '10',
            borderLeftColor: '#FFD700',
        },
        translationHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.sm,
        },
        translationName: {
            fontSize: FONT_SIZES.medium,
            fontWeight: '600',
            color: theme.primary,
            flex: 1,
        },
        favoriteTranslationName: {
            color: '#B8860B',
            fontWeight: '700',
        },
        shareButton: {
            backgroundColor: theme.secondary,
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            borderRadius: 8,
            marginLeft: SPACING.sm,
        },
        shareButtonText: {
            color: theme.headerText,
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
        },
        translationText: {
            fontSize: FONT_SIZES.medium,
            lineHeight: FONT_SIZES.medium * 1.4,
            color: theme.text,
            textAlign: 'left',
        },
        favoriteTranslationText: {
            fontWeight: '500',
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.xl,
        },
        emptyStateText: {
            fontSize: FONT_SIZES.medium,
            color: theme.textSecondary,
            textAlign: 'center',
        },
    });

    if (availableTranslations.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <HeaderWithDarkModeToggle
                    title="Bütün Mealler"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                        Bu ayet için meal bulunamadı.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <HeaderWithDarkModeToggle
                title="Bütün Mealler"
                subtitle={`${getSurahName()} - ${verse.number}. Ayet`}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
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
                            {verse.number}. Ayet
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
                                        <Text style={styles.shareButtonText}>Paylaş</Text>
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