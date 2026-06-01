import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { DataUpdateProgress } from './DataUpdateProgress';
import { FONT_SIZES, SPACING } from '../constants';

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
    const styles = createStyles(theme);
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
                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={onDownloadPress}
                    >
                        <Text style={styles.downloadButtonText}>{downloadButtonLabel}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: theme.background,
    },
    card: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: SPACING.xl,
        margin: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    title: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        color: theme.primary,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    description: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    downloadButton: {
        backgroundColor: theme.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    downloadButtonText: {
        color: theme.headerText,
        fontSize: FONT_SIZES.large,
        fontWeight: '600',
    },
});
