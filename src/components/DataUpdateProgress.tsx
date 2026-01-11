import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme, FONT_SIZES, SPACING } from '../theme';

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
    return (
        <View style={styles.downloadProgress}>
            <View style={[styles.progressBarContainer, { backgroundColor: theme.border + '40' }]}>
                <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: theme.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                %{Math.round(progress)} - {status}
                {totalBytes && totalBytes > 0 && downloadedBytes !== undefined && downloadedBytes > 0 && (
                    `\n${(downloadedBytes / (1024 * 1024)).toFixed(1)}MB / ${(totalBytes / (1024 * 1024)).toFixed(1)}MB`
                )}
            </Text>
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 10 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    downloadProgress: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: SPACING.md,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        marginBottom: SPACING.md,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: FONT_SIZES.medium,
        textAlign: 'center',
        marginBottom: SPACING.sm,
        lineHeight: 20,
    },
});
