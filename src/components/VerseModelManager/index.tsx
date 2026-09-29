import React, { useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, X } from 'lucide-react-native';
import { AppButton } from '@/components/AppButton';
import { ProgressBar } from '@/components/ProgressBar';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';
import { deleteModel, downloadModel, VERSE_MODELS, VerseModel, VerseModelId } from '@/services/verseModels';
import { DeviceSupport, getUnsupportedReason, speechModel } from '@/services/verseFinder';

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
    const [downloading, setDownloading] = useState<{ id: VerseModelId; progress: number } | null>(null);
    const [error, setError] = useState<{ id: VerseModelId; message: string } | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const handleDownload = async (model: VerseModel) => {
        const controller = new AbortController();
        abortRef.current = controller;
        setError(null);
        setDownloading({ id: model.id, progress: 0 });
        try {
            await downloadModel(model, fraction => setDownloading({ id: model.id, progress: Math.round(fraction * 100) }), controller.signal);
            // The first downloaded model becomes the selected one
            if (!selectedId || !downloaded.has(selectedId)) onSelect(model.id);
        } catch (e: any) {
            if (!controller.signal.aborted) setError({ id: model.id, message: String(e?.message ?? e) });
        } finally {
            abortRef.current = null;
            setDownloading(null);
            onChanged();
        }
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
                            const isDownloading = downloading?.id === model.id;
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
                                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                            {isSelected && <View style={styles.radioDot} />}
                                        </View>
                                        <Text style={[common.textStrong, common.flex1, isSelected && common.textAccent]}>
                                            {t(`verseFinder.models.${model.id}.name`)}
                                        </Text>
                                        <Text style={common.smallText}>{t('verseFinder.models.size', { size: model.sizeMb })}</Text>
                                    </View>
                                    <Text style={[common.smallText, styles.indented]}>
                                        {t(`verseFinder.models.${model.id}.description`)}
                                    </Text>

                                    <View style={[styles.indented, styles.actions]}>
                                        {isDownloading ? (
                                            <>
                                                <ProgressBar progress={downloading.progress} style={common.flex1} />
                                                <Text style={common.smallText}>%{downloading.progress}</Text>
                                                <AppButton
                                                    icon={<X size={14} color={theme.primary} />}
                                                    title={t('verseFinder.models.cancel')}
                                                    variant="ghost"
                                                    size="small"
                                                    onPress={() => abortRef.current?.abort()}
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
                                                icon={<Download size={14} color={downloading ? theme.textSecondary : theme.primary} />}
                                                title={t('verseFinder.models.download')}
                                                variant="outline"
                                                size="small"
                                                onPress={() => handleDownload(model)}
                                                disabled={!!downloading}
                                            />
                                        )}
                                    </View>
                                    {error?.id === model.id && (
                                        <Text style={[common.smallText, styles.indented, styles.errorText]}>
                                            {t('verseFinder.models.downloadError', { message: error.message })}
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

const RADIO = 18;

const createStyles = (theme: Theme) => StyleSheet.create({
    radio: {
        width: RADIO,
        height: RADIO,
        borderRadius: RADIO / 2,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: theme.primary,
    },
    radioDot: {
        width: RADIO / 2,
        height: RADIO / 2,
        borderRadius: RADIO / 4,
        backgroundColor: theme.primary,
    },
    indented: {
        marginLeft: RADIO + SPACING.sm,
        marginTop: SPACING.xs,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    errorText: {
        color: theme.error,
    },
});
