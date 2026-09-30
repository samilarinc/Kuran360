import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Volume2 } from 'lucide-react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { RECITER_PREVIEW_VERSE } from '@/constants/reciterPreview';
import { SPACING, Theme } from '@/theme';

interface ReciterPickerModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ReciterPickerModal: React.FC<ReciterPickerModalProps> = ({ visible, onClose }) => {
    const { settings, updateSettings, availableReciters } = useSettings();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { playPreviewWithReciter } = useGlobalAudio();
    const { t } = useTranslation();

    const handleSelect = async (reciterId: string) => {
        onClose();
        await updateSettings({ selectedReciter: reciterId });
    };

    const handlePreview = async (reciterId: string) => {
        try {
            await playPreviewWithReciter(RECITER_PREVIEW_VERSE, reciterId);
        } catch (error) {
            console.log('Preview playback failed:', error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={common.pickerOverlay}>
                <SafeAreaView style={common.modalContainerCentered}>
                    <View style={common.pickerHeader}>
                        <Text style={common.pickerHeaderTitle}>{t('reciterSelector.title')}</Text>
                        <TouchableOpacity onPress={onClose} style={common.pickerCloseButton}>
                            <Text style={common.pickerCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={common.pickerList} showsVerticalScrollIndicator={false}>
                        {availableReciters.map(reciter => {
                            const isSelected = reciter.id === settings.selectedReciter;
                            return (
                                <TouchableOpacity
                                    key={reciter.id}
                                    style={[common.pickerOption, styles.option, common.rowBetween, common.gapSm, isSelected && common.pickerOptionSelected]}
                                    onPress={() => handleSelect(reciter.id)}
                                >
                                    <Text style={[common.text, common.flex1, isSelected && common.textAccent]}>
                                        {reciter.name}
                                    </Text>
                                    <TouchableOpacity
                                        accessibilityLabel={t('reciterSelector.preview')}
                                        style={styles.previewButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handlePreview(reciter.id);
                                        }}
                                        activeOpacity={0.6}
                                    >
                                        <Volume2 size={16} color={theme.primary} />
                                    </TouchableOpacity>
                                    <Text style={[common.textAccent, styles.check]}>{isSelected ? '✓' : ''}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    option: {
        paddingVertical: 10,
        marginVertical: 2,
    },
    previewButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    check: {
        width: SPACING.md,
        textAlign: 'center',
    },
});
