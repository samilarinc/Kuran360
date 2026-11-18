import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { isDataCached, loadAllVerses, ProgressCallback, VERSES_URL } from '@/data/quranData';
import { useDataAvailability } from '@/contexts/DataAvailabilityContext';
import { DOWNLOAD_KEYS, useDownload } from '@/services/downloads';

interface UseDownloadDataOptions {
    isDataAvailable: boolean;
}

export const useDownloadData = ({ isDataAvailable }: UseDownloadDataOptions) => {
    const { t } = useTranslation();
    const { refreshDataAvailability } = useDataAvailability();
    const download = useDownload(DOWNLOAD_KEYS.quran);
    const [totalBytes, setTotalBytes] = useState(0);

    useEffect(() => {
        const getFileSize = async () => {
            try {
                const response = await fetch(VERSES_URL, { method: 'HEAD' });
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    setTotalBytes(parseInt(contentLength, 10));
                }
            } catch (error) {
                console.warn('Could not fetch file size:', error);
            }
        };

        if (!isDataAvailable) {
            getFileSize();
        }
    }, [isDataAvailable]);

    // Runs in the shared download store, so it keeps going when the user leaves the screen
    const handleDownloadData = () =>
        download.start(async onProgress => {
            onProgress({ progress: 0, status: t('download.starting') });
            const progressCallback: ProgressCallback = (progress, status, downloaded, total) =>
                onProgress({ progress, status, downloadedBytes: downloaded, totalBytes: total });
            await loadAllVerses(progressCallback);
            if (!(await isDataCached())) throw new Error(t('download.failed'));
            onProgress({ progress: 100, status: t('download.doneReloading') });
            if (Platform.OS === 'web') {
                setTimeout(() => (globalThis as any).window?.location?.reload(), 500);
            } else {
                // The screens that needed the data show it once it's available
                await refreshDataAvailability();
            }
        });

    return {
        downloading: download.running,
        downloadProgress: download.progress,
        downloadStatus: download.error ? t('download.failed') : download.status ?? '',
        downloadedBytes: download.downloadedBytes ?? 0,
        totalBytes: download.totalBytes || totalBytes,
        handleDownloadData,
    };
};
