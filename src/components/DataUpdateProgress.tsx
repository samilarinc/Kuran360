import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Theme } from '../theme';
import { createStyles } from './DataUpdateProgress.styles';

interface DataUpdateProgressProps {
    progress: number;
    status: string;
    downloadedBytes?: number;
    totalBytes?: number;
    theme: Theme;
}

export const DataUpdateProgress: React.FC<DataUpdateProgressProps> = ({
    progress,
    status,
    downloadedBytes,
    totalBytes,
    theme
}) => {
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.downloadProgress}>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
                %{Math.round(progress)} - {status}
                {totalBytes && totalBytes > 0 && downloadedBytes !== undefined && downloadedBytes > 0 && (
                    `\n${(downloadedBytes / (1024 * 1024)).toFixed(1)}MB / ${(totalBytes / (1024 * 1024)).toFixed(1)}MB`
                )}
            </Text>
            <ActivityIndicator size="large" color={theme.primary} style={styles.activityIndicator} />
        </View>
    );
};
