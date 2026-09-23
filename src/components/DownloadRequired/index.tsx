import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Theme, CommonStyles, useThemedStyles } from '@/contexts/ThemeContext';
import { DataUpdateProgress } from '../DataUpdateProgress';
import { AppButton } from '../AppButton';
import { SPACING } from '@/theme';

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
    const styles = useThemedStyles(createStyles);
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
                    />
                )}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
    container: {
        ...common.container,
        ...common.center,
        padding: SPACING.xl,
    },
    card: {
        ...common.card,
        borderRadius: 12,
        padding: SPACING.xl,
        margin: SPACING.md,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    title: {
        ...common.titleLarge,
        color: theme.primary,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    description: {
        ...common.subtitle,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    downloadButton: {
        minWidth: 200,
    },
    });
};
