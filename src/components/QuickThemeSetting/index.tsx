import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { ThemeToggle } from '@msarinc/ui';
import { Palette } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles as createSettingItemStyles } from '../SettingItem/index.styles';
import { createStyles } from './index.styles';

const COLOR = '#F59E0B';

interface ThemeToggleLabels {
    light: string;
    dark: string;
    lightsOut: string;
    accessibilityLabel: (current: string, next: string) => string;
}

interface QuickThemeSettingProps {
    labels: ThemeToggleLabels;
}

export const QuickThemeSetting: React.FC<QuickThemeSettingProps> = ({ labels }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const settingItemStyles = useMemo(() => createSettingItemStyles(theme), [theme]);

    return (
        <View style={styles.quickSettingsSection}>
            <Text style={styles.quickSettingsTitle}>{t('settingsScreen.quickSettings')}</Text>
            <View style={settingItemStyles.settingItem}>
                <View style={settingItemStyles.settingContent}>
                    <View style={[settingItemStyles.settingIconWrap, { backgroundColor: COLOR + '1A' }]}>
                        <Palette size={18} color={COLOR} />
                    </View>
                    <View style={settingItemStyles.settingInfo}>
                        <Text style={settingItemStyles.settingLabel}>{t('settingsScreen.themeLabel')}</Text>
                        <Text style={settingItemStyles.settingDescription}>{t('settingsScreen.themeDescription')}</Text>
                    </View>
                </View>
                <ThemeToggle labels={labels} compact={false} />
            </View>
        </View>
    );
};
