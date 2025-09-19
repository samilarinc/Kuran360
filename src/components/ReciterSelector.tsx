import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useGlobalAudio } from '../contexts/AudioContext';
import { FONT_SIZES, SPACING } from '../constants';

export const ReciterSelector: React.FC = () => {
    const { settings, updateSettings, availableReciters } = useSettings();
    const { theme } = useTheme();
    const { playPreviewWithReciter } = useGlobalAudio();

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
        <View style={createStyles(theme).container}>
            <Text style={createStyles(theme).sectionTitle}>Okuyucu Seçimi</Text>
            <Text style={createStyles(theme).sectionDescription}>
                Ses dosyalarını okuyacak okuyucuyu seçin
            </Text>
            <View style={createStyles(theme).reciterContainer}>
                {availableReciters.map((reciter) => (
                    <TouchableOpacity
                        key={reciter.id}
                        style={[
                            createStyles(theme).reciterItem,
                            settings.selectedReciter === reciter.id && createStyles(theme).selectedReciterItem,
                        ]}
                        onPress={() => handleReciterChange(reciter.id)}
                        activeOpacity={0.7}
                    >
                        <View style={createStyles(theme).reciterInfo}>
                            <Text
                                style={[
                                    createStyles(theme).reciterText,
                                    settings.selectedReciter === reciter.id && createStyles(theme).selectedReciterText,
                                ]}
                            >
                                {reciter.name}
                            </Text>
                            <TouchableOpacity
                                style={createStyles(theme).previewButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    playPreview(reciter.id);
                                }}
                                activeOpacity={0.6}
                            >
                                <Text style={createStyles(theme).previewButtonText}>🔊</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[
                            createStyles(theme).radioButton,
                            settings.selectedReciter === reciter.id && createStyles(theme).selectedRadioButton,
                        ]}>
                            {settings.selectedReciter === reciter.id && (
                                <View style={createStyles(theme).radioButtonInner} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        marginVertical: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: SPACING.xs,
    },
    sectionDescription: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        marginBottom: SPACING.md,
        lineHeight: 20,
    },
    reciterContainer: {
        gap: SPACING.sm,
    },
    reciterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        backgroundColor: theme.cardBackground,
        borderWidth: 1,
        borderColor: theme.border,
        // 3D effect
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
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
    reciterText: {
        fontSize: FONT_SIZES.medium,
        color: theme.text,
        fontWeight: '500',
        flex: 1,
    },
    reciterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'space-between',
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
    previewButtonText: {
        fontSize: 16,
    },
    selectedReciterText: {
        color: theme.primary,
        fontWeight: '600',
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