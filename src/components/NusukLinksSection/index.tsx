import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileText, Landmark } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { createStyles as createChromeStyles } from '../TravelCardChrome.styles';
import { SPACING, Theme } from '@/theme';

interface NusukLinksSectionProps {
    onOpenEVisa: () => void;
    onOpenGooglePlay: () => void;
    onOpenAppStore: () => void;
}

export const NusukLinksSection: React.FC<NusukLinksSectionProps> = ({
    onOpenEVisa,
    onOpenGooglePlay,
    onOpenAppStore,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const chrome = useThemedStyles(createChromeStyles);

    return (
        <View style={common.mbXl}>
            <TouchableOpacity
                style={[styles.linkButton, common.rowGap]}
                onPress={onOpenEVisa}
            >
                <FileText size={16} color={theme.text} />
                <Text style={common.textStrong}>
                    {t('umrahChecklistScreen.eVisa')}
                </Text>
            </TouchableOpacity>

            <View style={[chrome.plannerCard, common.mtSm]}>
                <View style={[common.rowGap, common.mbXs]}>
                    <Landmark size={16} color={theme.text} />
                    <Text style={[chrome.plannerTitle, common.mb0]}>
                        {t('umrahChecklistScreen.nusukTitle')}
                    </Text>
                </View>
                <Text style={[common.smallText, common.mbMd]}>
                    {t('umrahChecklistScreen.nusukDescription')}
                </Text>
                <View style={common.rowGap}>
                    <TouchableOpacity style={chrome.plannerActionBtn} onPress={onOpenGooglePlay}>
                        <View style={common.rowGap}>
                            <Ionicons name="logo-google-playstore" size={18} color={theme.primary} />
                            <Text style={chrome.plannerActionBtnText}>{t('umrahChecklistScreen.googlePlay')}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={chrome.plannerActionBtn} onPress={onOpenAppStore}>
                        <View style={common.rowGap}>
                            <Ionicons name="logo-apple-appstore" size={18} color={theme.primary} />
                            <Text style={chrome.plannerActionBtnText}>{t('umrahChecklistScreen.appStore')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    linkButton: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderColor: theme.border,
    },
});
