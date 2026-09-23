import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeToggle } from '@msarinc/ui';
import { Palette } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { CommonStyles, useThemedStyles, useTheme } from '@/contexts/ThemeContext';
import { createStyles as createSettingItemStyles } from '../SettingItem';
import { SPACING, Theme } from '@/theme';

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
    const { common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const settingItemStyles = useThemedStyles(createSettingItemStyles);

    return (
        <View style={styles.quickSettingsSection}>
            <Text style={styles.quickSettingsTitle}>{t('settingsScreen.quickSettings')}</Text>
            <View style={settingItemStyles.settingItem}>
                <View style={common.rowFill}>
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

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        quickSettingsSection: {
            ...common.card,
            padding: 0,
            marginTop: SPACING.md,
            marginBottom: SPACING.lg,
            overflow: 'hidden',
        },
        quickSettingsTitle: {
            ...common.sectionLabel,
            color: theme.secondary,
            textTransform: 'uppercase',
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.md,
            paddingBottom: SPACING.xs,
        },
    });
};
