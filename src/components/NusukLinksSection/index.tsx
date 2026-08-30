import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileText, Landmark } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.section}>
            <TouchableOpacity
                style={[styles.linkButton, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                onPress={onOpenEVisa}
            >
                <FileText size={16} color={theme.text} />
                <Text style={styles.linkButtonText}>
                    {t('umrahChecklistScreen.eVisa')}
                </Text>
            </TouchableOpacity>

            <View style={styles.nusukCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Landmark size={16} color={theme.text} />
                    <Text style={[styles.nusukTitle, { marginBottom: 0 }]}>
                        {t('umrahChecklistScreen.nusukTitle')}
                    </Text>
                </View>
                <Text style={styles.nusukDesc}>
                    {t('umrahChecklistScreen.nusukDescription')}
                </Text>
                <View style={styles.appButtonsRow}>
                    <TouchableOpacity style={styles.appButton} onPress={onOpenGooglePlay}>
                        <View style={styles.appButtonContent}>
                            <Ionicons name="logo-google-playstore" size={18} color={theme.primary} />
                            <Text style={styles.appButtonText}>{t('umrahChecklistScreen.googlePlay')}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.appButton} onPress={onOpenAppStore}>
                        <View style={styles.appButtonContent}>
                            <Ionicons name="logo-apple-appstore" size={18} color={theme.primary} />
                            <Text style={styles.appButtonText}>{t('umrahChecklistScreen.appStore')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
