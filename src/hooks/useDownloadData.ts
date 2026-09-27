import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { isDataCached, loadAllVerses, ProgressCallback } from '@/data/quranData';

interface UseDownloadDataOptions {
    isDataAvailable: boolean;
    navigation: { navigate: (screen: 'Main') => void };
}

export const useDownloadData = ({ isDataAvailable, navigation }: UseDownloadDataOptions) => {
    const { t } = useTranslation();
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('');
    const [downloadedBytes, setDownloadedBytes] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);

    useEffect(() => {
        const getFileSize = async () => {
            try {
                let response: Response;
                if (Platform.OS === 'web') {
                    response = await fetch('/allVerses.json', { method: 'HEAD' });
                } else {
                    response = await fetch('https://kuran360.com/allVerses.json', { method: 'HEAD' });
                }
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

    const handleDownloadData = async () => {
        setDownloading(true);
        setDownloadProgress(0);
        setDownloadStatus(t('download.starting'));

        const progressCallback: ProgressCallback = (progress, status, downloaded, total) => {
            setDownloadProgress(progress);
            setDownloadStatus(status);
            if (downloaded !== undefined) setDownloadedBytes(downloaded);
            if (total !== undefined) setTotalBytes(total);
        };

        try {
            await loadAllVerses(progressCallback);
            const isCached = await isDataCached();
            if (isCached) {
                setDownloadStatus(t('download.doneReloading'));
                if (Platform.OS === 'web') {
                    setTimeout(() => {
                        const globalObj = globalThis as any;
                        if (globalObj.window?.location) {
                            globalObj.window.location.reload();
                        }
                    }, 500);
                } else {
                    setTimeout(() => {
                        navigation.navigate('Main');
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Download failed:', error);
            setDownloadStatus(t('download.failed'));
        } finally {
            setDownloading(false);
        }
    };

    return {
        downloading,
        downloadProgress,
        downloadStatus,
        downloadedBytes,
        totalBytes,
        handleDownloadData,
    };
};
