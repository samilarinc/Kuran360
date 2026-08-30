import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { DataUpdateProgress } from '../DataUpdateProgress';
import { AppButton } from '../AppButton';
import { createStyles } from './index.styles';

interface DownloadRequiredProps {
    title: string;
    description: string;
    totalBytes: number;
    downloading: boolean;
    downloadProgress: number;
    downloadStatus: string;
    downloadedBytes: number;
    onDownloadPress: () => void;
    downloadButtonLabel?: string;
}

export const DownloadRequired: React.FC<DownloadRequiredProps> = ({
    title,
    description,
    totalBytes,
    downloading,
    downloadProgress,
    downloadStatus,
    downloadedBytes,
    onDownloadPress,
    downloadButtonLabel = '📥 Meal Verilerini İndir',
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const sizeHint = totalBytes > 0
        ? `\nBu işlem ${(totalBytes / (1024 * 1024)).toFixed(1)}MB veri indirecektir.`
        : '';

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}{sizeHint}</Text>

                {downloading ? (
                    <DataUpdateProgress
                        progress={downloadProgress}
                        status={downloadStatus}
                        downloadedBytes={downloadedBytes}
                        totalBytes={totalBytes}
                        theme={theme}
                    />
                ) : (
                    <AppButton
                        title={downloadButtonLabel}
                        onPress={onDownloadPress}
                        variant="primary"
                        size="large"
                        style={styles.downloadButton}
                        textStyle={styles.downloadButtonText}
                    />
                )}
            </View>
        </View>
    );
};
