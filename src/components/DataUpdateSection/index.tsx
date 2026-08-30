import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { CircleCheckBig, Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/theme';
import { AppButton } from '@/components/AppButton';
import { DataUpdateProgress } from '@/components/DataUpdateProgress';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    if (isUpdating) {
        return (
            <View style={{ padding: SPACING.lg }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, padding: SPACING.md }}>
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
            style={styles.updateButton}
        />
    );
};
