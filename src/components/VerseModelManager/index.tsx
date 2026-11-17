import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, X } from 'lucide-react-native';
import { AppButton } from '@/components/AppButton';
import { ProgressBar } from '@/components/ProgressBar';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';
import { deleteModel, downloadModel, VERSE_MODELS, VerseModel, VerseModelId } from '@/services/verseModels';
import { DeviceSupport, getUnsupportedReason, speechModel } from '@/services/verseFinder';
import { DOWNLOAD_KEYS, useDownloadFinished, useDownloads } from '@/services/downloads';

interface VerseModelManagerProps {
    visible: boolean;
    onClose: () => void;
    support: DeviceSupport | null;
    selectedId: VerseModelId | null;
    downloaded: Set<VerseModelId>;
    onSelect: (id: VerseModelId) => void;
    /** Called after a download or delete so the caller can refresh `downloaded`. */
    onChanged: () => void;
}

/** Lists the verse finder's speech models: download, delete, and pick the one to use. */
export const VerseModelManager: React.FC<VerseModelManagerProps> = ({
    visible,
    onClose,
    support,
    selectedId,
    downloaded,
    onSelect,
    onChanged,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const downloads = useDownloads();
    // A download (here or on another screen) ended: the caller re-checks what's downloaded
    useDownloadFinished(onChanged);

    // Runs in the shared download store, so it keeps going after the manager or the screen closes
    const handleDownload = async (model: VerseModel) => {
        const done = await downloads.start(DOWNLOAD_KEYS.model(model.id), (onProgress, signal) =>
            downloadModel(model, fraction => onProgress({ progress: Math.round(fraction * 100) }), signal),
        );
        // The first downloaded model becomes the selected one
        if (done && (!selectedId || !downloaded.has(selectedId))) onSelect(model.id);
    };

    const handleDelete = async (model: VerseModel) => {
        if (speechModel.modelId === model.id) speechModel.unload();
        await deleteModel(model);
        onChanged();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={common.pickerOverlay}>
                <SafeAreaView style={common.modalContainerCentered}>
                    <View style={common.pickerHeader}>
                        <Text style={common.pickerHeaderTitle}>{t('verseFinder.models.title')}</Text>
                        <TouchableOpacity onPress={onClose} style={common.pickerCloseButton}>
                            <Text style={common.pickerCloseButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={common.pickerList} showsVerticalScrollIndicator={false}>
                        {VERSE_MODELS.map(model => {
                            const unsupportedReason = support ? getUnsupportedReason(model, support) : null;
                            const supported = !unsupportedReason;
                            const isDownloaded = downloaded.has(model.id);
                            const isSelected = model.id === selectedId && isDownloaded;
                            const key = DOWNLOAD_KEYS.model(model.id);
                            const progress = downloads.progressOf(key);
                            const isDownloading = progress !== null;
                            const error = downloads.errorOf(key);
                            const canSelect = supported && isDownloaded;

                            return (
                                <TouchableOpacity
                                    key={model.id}
                                    style={[common.pickerOption, isSelected && common.pickerOptionSelected, !supported && common.disabled]}
                                    onPress={() => canSelect && onSelect(model.id)}
                                    activeOpacity={canSelect ? 0.7 : 1}
                                    disabled={!canSelect}
                                >
                                    <View style={[common.row, common.gapSm]}>
                                        <View style={[common.pickerRadio, isSelected && common.pickerRadioSelected]}>
                                            {isSelected && <View style={common.pickerRadioDot} />}
                                        </View>
                                        <Text style={[common.textStrong, common.flex1, isSelected && common.textAccent]}>
                                            {t(`verseFinder.models.${model.id}.name`)}
                                        </Text>
                                        <Text style={common.smallText}>{t('verseFinder.models.size', { size: model.sizeMb })}</Text>
                                    </View>
                                    <Text style={[common.smallText, common.pickerRadioIndented]}>
                                        {t(`verseFinder.models.${model.id}.description`)}
                                    </Text>

                                    <View style={[common.pickerRadioIndented, styles.actions]}>
                                        {isDownloading ? (
                                            <>
                                                <ProgressBar progress={progress} style={common.flex1} />
                                                <Text style={common.smallText}>%{progress}</Text>
                                                <AppButton
                                                    icon={<X size={14} color={theme.primary} />}
                                                    title={t('verseFinder.models.cancel')}
                                                    variant="ghost"
                                                    size="small"
                                                    onPress={() => downloads.cancel(key)}
                                                />
                                            </>
                                        ) : isDownloaded ? (
                                            // Deletable even when the device can no longer run it
                                            <>
                                                <Text style={[common.smallText, common.flex1]}>
                                                    {supported ? t('verseFinder.models.downloaded') : t(`verseFinder.models.unsupported.${unsupportedReason}`)}
                                                </Text>
                                                <AppButton
                                                    icon={<Trash2 size={14} color={theme.error} />}
                                                    title={t('verseFinder.models.delete')}
                                                    variant="ghost"
                                                    size="small"
                                                    textStyle={styles.errorText}
                                                    onPress={() => handleDelete(model)}
                                                />
                                            </>
                                        ) : !supported ? (
                                            <Text style={common.smallText}>{t(`verseFinder.models.unsupported.${unsupportedReason}`)}</Text>
                                        ) : (
                                            <AppButton
                                                icon={<Download size={14} color={theme.primary} />}
                                                title={t('verseFinder.models.download')}
                                                variant="outline"
                                                size="small"
                                                onPress={() => handleDownload(model)}
                                            />
                                        )}
                                    </View>
                                    {error && (
                                        <Text style={[common.smallText, common.pickerRadioIndented, styles.errorText]}>
                                            {t('verseFinder.models.downloadError', { message: error })}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        <Text style={[common.smallText, common.pMd]}>{t('verseFinder.models.note')}</Text>
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    errorText: {
        color: theme.error,
    },
});
