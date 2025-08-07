import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { FONT_SIZES, SPACING } from '../constants';

interface SettingsScreenProps {
    navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { settings, updateSettings, availableTranslations } = useSettings();
    const { theme } = useTheme();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        translations: true, // Expand translations section by default
    });

    const toggleSection = (sectionKey: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const toggleTranslation = (translationName: string) => {
        const currentTranslations = settings.selectedTranslations;
        let newTranslations;

        if (currentTranslations.includes(translationName)) {
            // Don't allow removing the last translation
            if (currentTranslations.length <= 1) {
                Alert.alert(
                    'Uyarı',
                    'En az bir meal seçili olmalıdır.',
                    [{ text: 'Tamam', style: 'default' }]
                );
                return;
            }
            newTranslations = currentTranslations.filter(t => t !== translationName);
        } else {
            newTranslations = [...currentTranslations, translationName];
        }

        updateSettings({ selectedTranslations: newTranslations });
    };

    const selectAllTranslations = () => {
        updateSettings({ selectedTranslations: [...availableTranslations] });
    };

    const selectDefaultTranslations = () => {
        updateSettings({
            selectedTranslations: [
                'Diyanet İşleri Meali (Yeni)',
                'Elmalılı Hamdi Yazır Meali',
                'Süleymaniye Vakfı Meali'
            ]
        });
    };

    const renderTranslationItem = (translationName: string) => {
        const isSelected = settings.selectedTranslations.includes(translationName);

        return (
            <TouchableOpacity
                key={translationName}
                style={[createStyles(theme).translationItem, isSelected && createStyles(theme).selectedTranslationItem]}
                onPress={() => toggleTranslation(translationName)}
                activeOpacity={0.7}
            >
                <Text style={[createStyles(theme).translationText, isSelected && createStyles(theme).selectedTranslationText]}>
                    {translationName}
                </Text>
                <View style={[createStyles(theme).checkbox, isSelected && createStyles(theme).checkedBox]}>
                    {isSelected && <Text style={createStyles(theme).checkmark}>✓</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={createStyles(theme).container}>
            <HeaderWithDarkModeToggle
                title="Ayarlar"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView style={createStyles(theme).content} showsVerticalScrollIndicator={false}>

                {/* Theme Section */}
                <View style={createStyles(theme).section}>
                    <Text style={createStyles(theme).sectionTitle}>Tema</Text>

                    <View style={createStyles(theme).settingItem}>
                        <View style={createStyles(theme).settingInfo}>
                            <Text style={createStyles(theme).settingLabel}>Koyu Mod</Text>
                            <Text style={createStyles(theme).settingDescription}>
                                Karanlık tema kullan
                            </Text>
                        </View>
                        <Switch
                            value={settings.darkMode}
                            onValueChange={(value) => updateSettings({ darkMode: value })}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor={settings.darkMode ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Autoplay Section */}
                <View style={createStyles(theme).section}>
                    <Text style={createStyles(theme).sectionTitle}>Ses Ayarları</Text>

                    <View style={createStyles(theme).settingItem}>
                        <View style={createStyles(theme).settingInfo}>
                            <Text style={createStyles(theme).settingLabel}>Otomatik Oynatma</Text>
                            <Text style={createStyles(theme).settingDescription}>
                                Bir ayet bitince otomatik olarak sonraki ayete geç
                            </Text>
                        </View>
                        <Switch
                            value={settings.autoplayEnabled}
                            onValueChange={(value) => updateSettings({ autoplayEnabled: value })}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor={settings.autoplayEnabled ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Display Options */}
                <View style={createStyles(theme).section}>
                    <Text style={createStyles(theme).sectionTitle}>Görünüm Seçenekleri</Text>

                    <View style={createStyles(theme).settingItem}>
                        <View style={createStyles(theme).settingInfo}>
                            <Text style={createStyles(theme).settingLabel}>Türkçe Okunuş</Text>
                            <Text style={createStyles(theme).settingDescription}>
                                Ayetlerin okunuş şeklini göster
                            </Text>
                        </View>
                        <Switch
                            value={settings.showTransliteration}
                            onValueChange={(value) => updateSettings({ showTransliteration: value })}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor={settings.showTransliteration ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>

                    <View style={createStyles(theme).settingItem}>
                        <View style={createStyles(theme).settingInfo}>
                            <Text style={createStyles(theme).settingLabel}>Kelime Çevirileri</Text>
                            <Text style={createStyles(theme).settingDescription}>
                                Her kelimenin altında Türkçe karşılığını göster
                            </Text>
                        </View>
                        <Switch
                            value={settings.showWordTranslations}
                            onValueChange={(value) => updateSettings({ showWordTranslations: value })}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor={settings.showWordTranslations ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>

                    <View style={createStyles(theme).settingItem}>
                        <View style={createStyles(theme).settingInfo}>
                            <Text style={createStyles(theme).settingLabel}>Sayfalı Görünüm</Text>
                            <Text style={createStyles(theme).settingDescription}>
                                Her ayeti ayrı sayfada göster (kaydırarak geçiş)
                            </Text>
                        </View>
                        <Switch
                            value={settings.usePaginatedView}
                            onValueChange={(value) => updateSettings({ usePaginatedView: value })}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor={settings.usePaginatedView ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Translation Selection */}
                <View style={createStyles(theme).section}>
                    <TouchableOpacity
                        style={createStyles(theme).sectionHeader}
                        onPress={() => toggleSection('translations')}
                        activeOpacity={0.7}
                    >
                        <Text style={createStyles(theme).sectionTitle}>
                            Meal Seçimi ({settings.selectedTranslations.length} seçili)
                        </Text>
                        <Text style={createStyles(theme).expandIcon}>
                            {expandedSections.translations ? '▼' : '▶'}
                        </Text>
                    </TouchableOpacity>

                    {expandedSections.translations && (
                        <View style={createStyles(theme).translationsContainer}>
                            <View style={createStyles(theme).translationActions}>
                                <TouchableOpacity
                                    style={createStyles(theme).actionButton}
                                    onPress={selectAllTranslations}
                                >
                                    <Text style={createStyles(theme).actionButtonText}>Tümünü Seç</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[createStyles(theme).actionButton, createStyles(theme).secondaryButton]}
                                    onPress={selectDefaultTranslations}
                                >
                                    <Text style={[createStyles(theme).actionButtonText, createStyles(theme).secondaryButtonText]}>
                                        Varsayılan
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {availableTranslations.map(renderTranslationItem)}
                        </View>
                    )}
                </View>

                <View style={createStyles(theme).footer}>
                    <Text style={createStyles(theme).footerText}>
                        Seçili mealler ayetlerin altında gösterilecektir.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    section: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        marginBottom: SPACING.md,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.text,
        flex: 1,
    },
    expandIcon: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        marginLeft: SPACING.sm,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    settingInfo: {
        flex: 1,
        marginRight: SPACING.md,
    },
    settingLabel: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        lineHeight: 18,
    },
    translationsContainer: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
    },
    translationActions: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    actionButton: {
        backgroundColor: theme.primary,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        flex: 1,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.primary,
    },
    actionButtonText: {
        color: theme.headerText,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        textAlign: 'center',
    },
    secondaryButtonText: {
        color: theme.primary,
    },
    translationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        marginVertical: 2,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    selectedTranslationItem: {
        backgroundColor: theme.primary + '10',
    },
    translationText: {
        fontSize: FONT_SIZES.small,
        color: theme.text,
        flex: 1,
    },
    selectedTranslationText: {
        color: theme.primary,
        fontWeight: '500',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.sm,
    },
    checkedBox: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    checkmark: {
        color: theme.headerText,
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        padding: SPACING.md,
        alignItems: 'center',
    },
    footerText: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});
