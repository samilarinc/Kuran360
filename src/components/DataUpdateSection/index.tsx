import React from 'react';
import { View, Text } from 'react-native';
import { CircleCheckBig, Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/theme';
import { AppButton } from '@/components/AppButton';
import { DataUpdateProgress } from '@/components/DataUpdateProgress';

const COLOR = '#64748B';

interface DataUpdateSectionProps {
    isUpdating: boolean;
    isUpToDate: boolean;
    downloadProgress: number;
    downloadStatus: string;
    downloadedBytes: number;
    totalBytes: number;
    onUpdate: () => void;
}

export const DataUpdateSection: React.FC<DataUpdateSectionProps> = ({
    isUpdating,
    isUpToDate,
    downloadProgress,
    downloadStatus,
    downloadedBytes,
    totalBytes,
    onUpdate,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();

    if (isUpdating) {
        return (
            <View style={common.pLg}>
                <DataUpdateProgress
                    progress={downloadProgress}
                    status={downloadStatus}
                    downloadedBytes={downloadedBytes}
                    totalBytes={totalBytes}
                    theme={theme}
                />
            </View>
        );
    }

    if (isUpToDate) {
        return (
            <View style={[common.row, common.center, common.gapXs, common.pMd]}>
                <CircleCheckBig size={16} color={COLOR} />
                <Text style={common.footerText}>
                    {t('settingsScreen.dataUpToDate')}
                </Text>
            </View>
        );
    }

    return (
        <AppButton
            variant="outline"
            size="medium"
            title={t('settingsScreen.updateButton')}
            icon={<Download size={16} color={theme.primary} />}
            onPress={onUpdate}
            style={[common.buttonOutline, { backgroundColor: theme.primary + '10', margin: SPACING.lg }]}
        />
    );
};
