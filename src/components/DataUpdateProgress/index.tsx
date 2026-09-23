import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Theme, FONT_SIZES, SPACING } from '@/theme';
import { ProgressBar } from '../ProgressBar';
import { useThemedStyles } from '@/contexts/ThemeContext';

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
    const styles = useThemedStyles(createStyles);

    return (
        <View style={styles.downloadProgress}>
            <ProgressBar
                progress={progress}
                trackColor={theme.border + '40'}
                fillColor={theme.primary}
                style={styles.progressBarContainer}
            />
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

const createStyles = (theme: Theme) => StyleSheet.create({
    downloadProgress: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: SPACING.md,
    },
    progressBarContainer: {
        marginBottom: SPACING.md,
    },
    progressText: {
        fontSize: FONT_SIZES.medium,
        textAlign: 'center',
        marginBottom: SPACING.sm,
        lineHeight: 20,
        color: theme.textSecondary,
    },
    activityIndicator: {
        marginTop: 10,
    },
});
