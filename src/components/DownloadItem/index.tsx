import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Download, RefreshCw, Trash2, X } from 'lucide-react-native';
import { AppButton } from '@/components/AppButton';
import { ProgressBar } from '@/components/ProgressBar';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';

interface DownloadItemProps {
    title: string;
    description?: string;
    /** Size of the download, shown next to the title */
    sizeMb?: number;
    downloaded: boolean;
    /** Why it can't be downloaded here (e.g. no WebGPU); a downloaded item can still be deleted */
    unavailableReason?: string | null;
    /** Overrides the status line, e.g. "Up to date (3.3)" */
    status?: string;
    /** 0–100 while downloading */
    progress?: number | null;
    error?: string | null;
    /** Another download is running: this one can't start */
    busy?: boolean;
    onDownload: () => void;
    onCancel?: () => void;
    /** Omitted for data the app can't do without */
    onDelete?: () => void;
    /** Offered on a downloaded item that has a newer version */
    onUpdate?: () => void;
    isLast?: boolean;
}

/** One downloadable thing on the data management screen: its size, whether it's on the device, and its actions. */
export const DownloadItem: React.FC<DownloadItemProps> = ({
    title,
    description,
    sizeMb,
    downloaded,
    unavailableReason,
    status,
    progress,
    error,
    busy,
    onDownload,
    onCancel,
    onDelete,
    onUpdate,
    isLast,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const downloading = progress !== null && progress !== undefined;

    return (
        <View style={[styles.item, !isLast && styles.divider]}>
            <View style={[common.row, common.gapSm]}>
                <Text style={[common.textStrong, common.flex1]}>{title}</Text>
                {sizeMb !== undefined && <Text style={common.smallText}>{t('dataManagement.size', { size: sizeMb })}</Text>}
            </View>
            {!!description && <Text style={[common.smallText, styles.description]}>{description}</Text>}

            <View style={styles.actions}>
                {downloading ? (
                    <>
                        <ProgressBar progress={progress} style={common.flex1} />
                        <Text style={common.smallText}>%{progress}</Text>
                        {onCancel && (
                            <AppButton
                                icon={<X size={14} color={theme.primary} />}
                                title={t('dataManagement.cancel')}
                                variant="ghost"
                                size="small"
                                onPress={onCancel}
                            />
                        )}
                    </>
                ) : downloaded ? (
                    <>
                        <Text style={[common.smallText, common.flex1, styles.downloaded]}>
                            {status ?? unavailableReason ?? t('dataManagement.downloaded')}
                        </Text>
                        {onUpdate && (
                            <AppButton
                                icon={<RefreshCw size={14} color={busy ? theme.textSecondary : theme.primary} />}
                                title={t('dataManagement.update')}
                                variant="outline"
                                size="small"
                                onPress={onUpdate}
                                disabled={busy}
                            />
                        )}
                        {onDelete && (
                            <AppButton
                                icon={<Trash2 size={14} color={theme.error} />}
                                title={t('dataManagement.delete')}
                                variant="ghost"
                                size="small"
                                textStyle={styles.errorText}
                                onPress={onDelete}
                                disabled={busy}
                            />
                        )}
                    </>
                ) : unavailableReason ? (
                    <Text style={[common.smallText, common.flex1]}>{unavailableReason}</Text>
                ) : (
                    <>
                        <Text style={[common.smallText, common.flex1]}>{status ?? t('dataManagement.notDownloaded')}</Text>
                        <AppButton
                            icon={<Download size={14} color={busy ? theme.textSecondary : theme.primary} />}
                            title={t('dataManagement.download')}
                            variant="outline"
                            size="small"
                            onPress={onDownload}
                            disabled={busy}
                        />
                    </>
                )}
            </View>
            {!!error && <Text style={[common.smallText, styles.errorText]}>{t('dataManagement.error', { message: error })}</Text>}
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    item: {
        padding: SPACING.md,
        gap: SPACING.xs,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    description: {
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.xs,
        minHeight: 32,
    },
    downloaded: {
        color: theme.success,
    },
    errorText: {
        color: theme.error,
    },
});
