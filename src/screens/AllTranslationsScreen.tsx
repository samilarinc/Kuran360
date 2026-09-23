import React, { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { ShareModal } from '@/components/ShareModal';
import { AppButton } from '@/components/AppButton';
import { ArabicText } from '@/components/ArabicText';
import { Badge } from '@/components/Badge';
import { SPACING, FONT_SIZES, FAVORITE_COLOR, FAVORITE_COLOR_DARK, Theme } from '@/theme';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useDebouncedSettings } from '@/hooks/useDebouncedSettings';
import { Verse as VerseType, VerseShareData } from '@/types';
import { getSurahNameByNumber } from '@/utils/surahName';
import { formatVerseNumber } from '@/utils/numerals';

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
    const { theme, common } = useTheme();
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

    const styles = useThemedStyles(createStyles);

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
                    <View style={[common.rowBetween, common.mtSm]}>
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
                                <View style={[common.rowBetween, common.mbSm]}>
                                    <Text style={[
                                        common.textAccent,
                                        common.flex1,
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

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
    verseHeader: {
        backgroundColor: theme.cardBackground,
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    arabicText: {
        ...common.arabicText,
        marginBottom: SPACING.sm,
    },
    surahInfo: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    translationItem: {
        ...common.card,
        marginHorizontal: SPACING.md,
        marginTop: SPACING.xs,
        marginBottom: SPACING.xs,
        padding: SPACING.md,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
        shadowRadius: 2,
    },
    favoriteTranslationItem: {
        backgroundColor: FAVORITE_COLOR + '10',
        borderLeftColor: FAVORITE_COLOR,
    },
    favoriteTranslationName: {
        color: FAVORITE_COLOR_DARK,
        fontWeight: '700',
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
    emptyStateText: {
        ...common.emptyStateText,
        fontStyle: 'normal',
    },
    });
};
