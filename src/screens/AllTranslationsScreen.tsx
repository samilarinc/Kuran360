import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { ShareModal } from '@/components/ShareModal';
import { AppButton } from '@/components/AppButton';
import { ArabicText } from '@/components/ArabicText';
import { Badge } from '@/components/Badge';
import { SPACING } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useDebouncedSettings } from '@/hooks/useDebouncedSettings';
import { Verse as VerseType, VerseShareData } from '@/types';
import { getSurahNameByNumber } from '@/utils/surahName';
import { formatVerseNumber } from '@/utils/numerals';
import { createCommonStyles } from '@/theme/common.styles';
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
    const { settings: debouncedSettings } = useDebouncedSettings(200);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedTranslation, setSelectedTranslation] = useState<string>(debouncedSettings.favoriteTranslation);

    const surahName = useMemo(() => getSurahNameByNumber(t, verse.surahNumber), [t, verse.surahNumber]);

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
        const translation = verse.allTranslations?.[selectedTranslation] || verse.translation || '';

        return {
            arabicText: verse.arabicText,
            translation: translation,
            surahName: surahName,
            verseNumber: verse.number,
            surahNumber: verse.surahNumber,
        };
    }, [verse, selectedTranslation, surahName]);

    const handleShare = (translationName: string) => {
        setSelectedTranslation(translationName);
        setShareModalVisible(true);
    };

    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    if (availableTranslations.length === 0) {
        return (
            <SafeAreaView style={common.container}>
                <AppHeader
                    title={t('screenTitles.allTranslations')}
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                    showHomeButton={true}
                    onHomePress={() => navigation.navigate('Main')}
                />
                <View style={common.emptyState}>
                    <Text style={styles.emptyStateText}>
                        {t('allTranslationsScreen.noTranslationsFound')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.allTranslations')}
                subtitle={t('allTranslationsScreen.verseSubtitle', { surahName, verseNumber: formatVerseNumber(verse.number, settings.verseNumberStyle) })}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView style={common.flex1} showsVerticalScrollIndicator={false}>
                {/* Ayet Header */}
                <View style={styles.verseHeader}>
                    <ArabicText style={styles.arabicText}>
                        {verse.arabicText}
                    </ArabicText>
                    <View style={styles.verseInfo}>
                        <Text style={styles.surahInfo}>
                            {surahName}
                        </Text>
                        <Badge label={t('allTranslationsScreen.verseBadge', { verseNumber: formatVerseNumber(verse.number, settings.verseNumberStyle) })} />
                    </View>
                </View>

                {/* Meal Listesi */}
                <View style={common.flex1}>
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
                                    <AppButton
                                        title={t('allTranslationsScreen.share')}
                                        onPress={() => handleShare(translationName)}
                                        variant="secondary"
                                        size="small"
                                        textStyle={{ color: theme.headerText }}
                                        style={{ marginLeft: SPACING.sm }}
                                    />
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