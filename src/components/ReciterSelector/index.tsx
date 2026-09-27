import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { SPACING, Theme } from '@/theme';

export const ReciterSelector: React.FC = () => {
    const { settings, updateSettings, availableReciters } = useSettings();
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { playPreviewWithReciter } = useGlobalAudio();
    const { t } = useTranslation();

    const playPreview = async (reciterId: string) => {
        try {
            const previewVerse = {
                id: '001002',
                surahNumber: 1,
                number: 2,
                arabicText: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
                translation: 'Hamd, âlemlerin Rabbi Allah\'a mahsustur.',
                transliteration: 'Al-hamdu lillahi rabbil-\'alameen',
                wordTranslations: [],
                allTranslations: {}
            };

            // Use the new preview function that doesn't change settings
            await playPreviewWithReciter(previewVerse, reciterId);
        } catch (error) {
            console.log('Preview playback failed:', error);
        }
    };

    const handleReciterChange = async (reciterId: string) => {
        await updateSettings({ selectedReciter: reciterId });
    };

    return (
        <View style={styles.container}>
            <Text style={common.title}>{t('reciterSelector.title')}</Text>
            <Text style={[common.smallText, common.mbMd]}>
                {t('reciterSelector.description')}
            </Text>
            <View style={common.gapSm}>
                {availableReciters.map((reciter) => (
                    <TouchableOpacity
                        key={reciter.id}
                        style={[
                            styles.reciterItem,
                            settings.selectedReciter === reciter.id && styles.selectedReciterItem,
                        ]}
                        onPress={() => handleReciterChange(reciter.id)}
                        activeOpacity={0.7}
                    >
                        <View style={common.rowFill}>
                            <Text
                                style={[
                                    common.text,
                                    common.flex1,
                                    settings.selectedReciter === reciter.id && common.textAccent,
                                ]}
                            >
                                {reciter.name}
                            </Text>
                            <TouchableOpacity
                                style={styles.previewButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    playPreview(reciter.id);
                                }}
                                activeOpacity={0.6}
                            >
                                <Text style={common.text}>🔊</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[
                            styles.radioButton,
                            settings.selectedReciter === reciter.id && styles.selectedRadioButton,
                        ]}>
                            {settings.selectedReciter === reciter.id && (
                                <View style={styles.radioButtonInner} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
    container: {
        marginVertical: SPACING.md,
    },
    reciterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...common.card,
        borderRadius: 12,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: theme.border,
        // 3D effect
        shadowRadius: 2,
    },
    selectedReciterItem: {
        backgroundColor: theme.primary + '15',
        borderColor: theme.primary,
        borderWidth: 2,
        // Enhanced 3D effect for selected state
        elevation: 4,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    previewButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: SPACING.sm,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
    },
    selectedRadioButton: {
        borderColor: theme.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.primary,
    },
    });
};
