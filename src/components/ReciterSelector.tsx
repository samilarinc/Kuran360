import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { createStyles } from './ReciterSelector.styles';

export const ReciterSelector: React.FC = () => {
    const { settings, updateSettings, availableReciters } = useSettings();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
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
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Okuyucu Seçimi</Text>
            <Text style={styles.sectionDescription}>
                Ses dosyalarını okuyacak okuyucuyu seçin
            </Text>
            <View style={styles.reciterContainer}>
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
                        <View style={styles.reciterInfo}>
                            <Text
                                style={[
                                    styles.reciterText,
                                    settings.selectedReciter === reciter.id && styles.selectedReciterText,
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
                                <Text style={styles.previewButtonText}>🔊</Text>
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
