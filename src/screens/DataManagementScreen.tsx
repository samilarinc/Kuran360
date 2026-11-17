import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { DownloadItem } from '@/components/DownloadItem';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useDataAvailability } from '@/contexts/DataAvailabilityContext';
import {
    clearCachedData,
    CURRENT_VERSION,
    getStoredDataVersion,
    loadAllVerses,
    ProgressCallback,
    VERSES_URL,
} from '@/data/quranData';
import { deleteEdition, downloadEdition, getEdition, isEditionDownloaded, TAFSIR_SOURCES } from '@/services/tafsir';
import { deleteModel, downloadModel, getDownloadedModels, VERSE_MODELS, VerseModelId } from '@/services/verseModels';
import { checkDeviceSupport, DeviceSupport, getUnsupportedReason, speechModel } from '@/services/verseFinder';
import { deleteTopicModel, downloadTopicModel, isTopicModelDownloaded, TOPIC_MODEL_SIZE_MB } from '@/services/topicSearch';
import { SPACING } from '@/theme';
import { DOWNLOAD_KEYS, DownloadTask, useDownloadFinished, useDownloads } from '@/services/downloads';

interface DataManagementScreenProps {
    navigation: any;
    /** Opened from the main screen's new data prompt: start the Quran data update right away */
    startDataUpdate?: boolean;
}

const QURAN_KEY = DOWNLOAD_KEYS.quran;
const TOPIC_KEY = DOWNLOAD_KEYS.topic;
const tafsirKey = DOWNLOAD_KEYS.tafsir;
const modelKey = (id: VerseModelId) => DOWNLOAD_KEYS.model(id);

const confirm = (title: string, message: string, confirmLabel: string, cancelLabel: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
        if ((globalThis as any).confirm?.(message)) onConfirm();
        return;
    }
    Alert.alert(title, message, [
        { text: cancelLabel, style: 'cancel' },
        { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
};

/**
 * Everything the app downloads, in one place: the Quran data (with the translations), the tafsirs and the speech
 * and topic search models. Downloads keep running after the user leaves the screen.
 */
export const DataManagementScreen: React.FC<DataManagementScreenProps> = ({ navigation, startDataUpdate }) => {
    const { common } = useTheme();
    const { t, i18n } = useTranslation();
    const { availableTranslations } = useSettings();
    const { isDataAvailable, refreshDataAvailability } = useDataAvailability();
    const styles = useThemedStyles(createStyles);

    const [dataVersion, setDataVersion] = useState<string | null>(null);
    const [quranSizeMb, setQuranSizeMb] = useState<number | undefined>();
    const [tafsirs, setTafsirs] = useState<Set<string>>(new Set());
    const [models, setModels] = useState<Set<VerseModelId>>(new Set());
    const [topicModel, setTopicModel] = useState(false);
    const [support, setSupport] = useState<DeviceSupport | null>(null);
    const downloads = useDownloads();

    const editions = TAFSIR_SOURCES.map(source => ({ source, edition: getEdition(source, i18n.language) }));

    const refresh = useCallback(async () => {
        const [version, tafsirFlags, downloadedModels, topic] = await Promise.all([
            getStoredDataVersion(),
            Promise.all(editions.map(({ edition }) => isEditionDownloaded(edition))),
            getDownloadedModels(),
            isTopicModelDownloaded(),
        ]);
        setDataVersion(version);
        setTafsirs(new Set(editions.filter((_, i) => tafsirFlags[i]).map(({ edition }) => edition)));
        setModels(downloadedModels);
        setTopicModel(topic);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n.language]);

    useEffect(() => {
        refresh();
        checkDeviceSupport().then(setSupport);
        fetch(VERSES_URL, { method: 'HEAD' })
            .then(response => {
                const bytes = parseInt(response.headers.get('content-length') ?? '', 10);
                if (bytes > 0) setQuranSizeMb(Math.round(bytes / 1e6));
            })
            .catch(() => undefined);
    }, [refresh]);

    // A download started here or on another screen ended: re-check what's on the device
    useDownloadFinished(refresh);

    /** Starts a download in the shared store; an error is shown under its item */
    const run = (key: string, task: (onProgress: (fraction: number) => void, signal: AbortSignal) => Promise<void>) => {
        const shared: DownloadTask = (onProgress, signal) =>
            task(fraction => onProgress({ progress: Math.round(fraction * 100) }), signal);
        return downloads.start(key, shared);
    };

    const progressOf = (key: string) => downloads.progressOf(key);
    const errorOf = (key: string) => downloads.errorOf(key);

    // The Quran data replaces the stored copy as a whole; the web app reloads to pick it up
    const updateQuranData = () =>
        run(QURAN_KEY, async onProgress => {
            const progressCallback: ProgressCallback = progress => onProgress(Math.min(0.99, progress / 100));
            await clearCachedData();
            try {
                await loadAllVerses(progressCallback);
            } finally {
                await refreshDataAvailability();
            }
            if (Platform.OS === 'web') {
                setTimeout(() => (globalThis as any).window?.location?.reload(), 500);
            } else {
                Alert.alert(t('settingsScreen.updateData.successTitle'), t('settingsScreen.updateData.successMessage'));
            }
        });

    const confirmQuranUpdate = () =>
        confirm(
            t('settingsScreen.updateData.title'),
            t('settingsScreen.updateData.message'),
            t('settingsScreen.updateData.confirm'),
            t('settingsScreen.updateData.cancel'),
            updateQuranData,
        );

    // Opened from the new data prompt: start right away
    useEffect(() => {
        if (startDataUpdate) updateQuranData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const confirmDelete = (name: string, onDelete: () => Promise<void>) =>
        confirm(
            t('dataManagement.deleteTitle'),
            t('dataManagement.deleteMessage', { name }),
            t('dataManagement.delete'),
            t('dataManagement.cancel'),
            async () => {
                await onDelete();
                refresh();
            },
        );

    const quranUpToDate = dataVersion === CURRENT_VERSION;
    const unsupportedText = (id: VerseModelId) => {
        const model = VERSE_MODELS.find(m => m.id === id)!;
        const reason = support ? getUnsupportedReason(model, support) : null;
        return reason ? t(`verseFinder.models.unsupported.${reason}`) : null;
    };

    // Sizes of what's on the device: the Quran data, plus each downloaded tafsir and model
    const usedMb =
        (isDataAvailable ? quranSizeMb ?? 0 : 0) +
        editions.filter(({ edition }) => tafsirs.has(edition)).reduce((sum, { source }) => sum + source.sizeMb, 0) +
        VERSE_MODELS.filter(m => models.has(m.id)).reduce((sum, m) => sum + m.sizeMb, 0) +
        (topicModel ? TOPIC_MODEL_SIZE_MB : 0);

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.dataManagement')}
                subtitle={t('dataManagement.used', { size: usedMb })}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView style={common.flex1} contentContainerStyle={styles.content}>
                <View>
                    <Text style={common.groupLabel}>{t('dataManagement.sections.quran')}</Text>
                    <View style={common.groupCard}>
                        <DownloadItem
                            title={t('dataManagement.quran.title')}
                            description={t('dataManagement.quran.description', { count: availableTranslations.length })}
                            sizeMb={quranSizeMb}
                            downloaded={isDataAvailable}
                            status={
                                quranUpToDate
                                    ? t('dataManagement.quran.upToDate', { version: CURRENT_VERSION })
                                    : isDataAvailable ? t('dataManagement.quran.updateAvailable') : undefined
                            }
                            progress={progressOf(QURAN_KEY)}
                            error={errorOf(QURAN_KEY)}
                            onDownload={updateQuranData}
                            onUpdate={isDataAvailable && !quranUpToDate ? confirmQuranUpdate : undefined}
                            isLast
                        />
                    </View>
                </View>

                <View>
                    <Text style={common.groupLabel}>{t('dataManagement.sections.tafsir')}</Text>
                    <View style={common.groupCard}>
                        {editions.map(({ source, edition }, index) => {
                            const key = tafsirKey(edition);
                            const name = t(`tafsir.sources.${source.id}.name`);
                            return (
                                <DownloadItem
                                    key={source.id}
                                    title={name}
                                    description={t(`tafsir.sources.${source.id}.description`)}
                                    sizeMb={source.sizeMb}
                                    downloaded={tafsirs.has(edition)}
                                    status={tafsirs.has(edition) ? undefined : t('dataManagement.live')}
                                    progress={progressOf(key)}
                                    error={errorOf(key)}
                                    onDownload={() => run(key, (onProgress, signal) => downloadEdition(edition, source.sizeMb, onProgress, signal))}
                                    onCancel={() => downloads.cancel(key)}
                                    onDelete={() => confirmDelete(name, () => deleteEdition(edition))}
                                    isLast={index === editions.length - 1}
                                />
                            );
                        })}
                    </View>
                </View>

                <View>
                    <Text style={common.groupLabel}>{t('dataManagement.sections.speech')}</Text>
                    <View style={common.groupCard}>
                        {VERSE_MODELS.map((model, index) => {
                            const key = modelKey(model.id);
                            const name = t(`verseFinder.models.${model.id}.name`);
                            return (
                                <DownloadItem
                                    key={model.id}
                                    title={name}
                                    description={t(`verseFinder.models.${model.id}.description`)}
                                    sizeMb={model.sizeMb}
                                    downloaded={models.has(model.id)}
                                    unavailableReason={unsupportedText(model.id)}
                                    progress={progressOf(key)}
                                    error={errorOf(key)}
                                    onDownload={() => run(key, (onProgress, signal) => downloadModel(model, onProgress, signal))}
                                    onCancel={() => downloads.cancel(key)}
                                    onDelete={() =>
                                        confirmDelete(name, async () => {
                                            if (speechModel.modelId === model.id) speechModel.unload();
                                            await deleteModel(model);
                                        })
                                    }
                                    isLast={index === VERSE_MODELS.length - 1}
                                />
                            );
                        })}
                    </View>
                    <Text style={[common.smallText, styles.note]}>{t('dataManagement.speechNote')}</Text>
                </View>

                <View>
                    <Text style={common.groupLabel}>{t('dataManagement.sections.topic')}</Text>
                    <View style={common.groupCard}>
                        <DownloadItem
                            title={t('dataManagement.topic.title')}
                            description={t('dataManagement.topic.description')}
                            sizeMb={TOPIC_MODEL_SIZE_MB}
                            downloaded={topicModel}
                            progress={progressOf(TOPIC_KEY)}
                            error={errorOf(TOPIC_KEY)}
                            onDownload={() => run(TOPIC_KEY, downloadTopicModel)}
                            onCancel={() => downloads.cancel(TOPIC_KEY)}
                            onDelete={() => confirmDelete(t('dataManagement.topic.title'), deleteTopicModel)}
                            isLast
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = () => StyleSheet.create({
    content: {
        padding: SPACING.md,
        gap: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    note: {
        marginTop: SPACING.sm,
        marginHorizontal: SPACING.xs,
    },
});
