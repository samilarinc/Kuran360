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
import { COLORS, FONT_SIZES, SPACING } from '../constants';

interface SettingsScreenProps {
    navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { settings, updateSettings, availableTranslations } = useSettings();
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
                style={[styles.translationItem, isSelected && styles.selectedTranslationItem]}
                onPress={() => toggleTranslation(translationName)}
                activeOpacity={0.7}
            >
                <Text style={[styles.translationText, isSelected && styles.selectedTranslationText]}>
                    {translationName}
                </Text>
                <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Ayarlar</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Autoplay Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ses Ayarları</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Otomatik Oynatma</Text>
                            <Text style={styles.settingDescription}>
                                Bir ayet bitince otomatik olarak sonraki ayete geç
                            </Text>
                        </View>
                        <Switch
                            value={settings.autoplayEnabled}
                            onValueChange={(value) => updateSettings({ autoplayEnabled: value })}
                            trackColor={{ false: COLORS.background, true: COLORS.primary }}
                            thumbColor={settings.autoplayEnabled ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Display Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Görünüm Seçenekleri</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Türkçe Okunuş</Text>
                            <Text style={styles.settingDescription}>
                                Ayetlerin okunuş şeklini göster
                            </Text>
                        </View>
                        <Switch
                            value={settings.showTransliteration}
                            onValueChange={(value) => updateSettings({ showTransliteration: value })}
                            trackColor={{ false: COLORS.background, true: COLORS.primary }}
                            thumbColor={settings.showTransliteration ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Kelime Çevirileri</Text>
                            <Text style={styles.settingDescription}>
                                Her kelimenin altında Türkçe karşılığını göster
                            </Text>
                        </View>
                        <Switch
                            value={settings.showWordTranslations}
                            onValueChange={(value) => updateSettings({ showWordTranslations: value })}
                            trackColor={{ false: COLORS.background, true: COLORS.primary }}
                            thumbColor={settings.showWordTranslations ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Sayfalı Görünüm</Text>
                            <Text style={styles.settingDescription}>
                                Her ayeti ayrı sayfada göster (kaydırarak geçiş)
                            </Text>
                        </View>
                        <Switch
                            value={settings.usePaginatedView}
                            onValueChange={(value) => updateSettings({ usePaginatedView: value })}
                            trackColor={{ false: COLORS.background, true: COLORS.primary }}
                            thumbColor={settings.usePaginatedView ? '#FFFFFF' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Translation Selection */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection('translations')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionTitle}>
                            Meal Seçimi ({settings.selectedTranslations.length} seçili)
                        </Text>
                        <Text style={styles.expandIcon}>
                            {expandedSections.translations ? '▼' : '▶'}
                        </Text>
                    </TouchableOpacity>

                    {expandedSections.translations && (
                        <View style={styles.translationsContainer}>
                            <View style={styles.translationActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={selectAllTranslations}
                                >
                                    <Text style={styles.actionButtonText}>Tümünü Seç</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.secondaryButton]}
                                    onPress={selectDefaultTranslations}
                                >
                                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                                        Varsayılan
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {availableTranslations.map(renderTranslationItem)}
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Seçili mealler ayetlerin altında gösterilecektir.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.surface,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    backButton: {
        position: 'absolute',
        left: SPACING.md,
        top: SPACING.lg,
        zIndex: 1,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
    },
    backButtonText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    title: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    section: {
        backgroundColor: COLORS.surface,
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
        color: COLORS.text,
        flex: 1,
    },
    expandIcon: {
        fontSize: FONT_SIZES.medium,
        color: COLORS.textSecondary,
        marginLeft: SPACING.sm,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    settingInfo: {
        flex: 1,
        marginRight: SPACING.md,
    },
    settingLabel: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
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
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        flex: 1,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        textAlign: 'center',
    },
    secondaryButtonText: {
        color: COLORS.primary,
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
        backgroundColor: COLORS.primary + '10',
    },
    translationText: {
        fontSize: FONT_SIZES.small,
        color: COLORS.text,
        flex: 1,
    },
    selectedTranslationText: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.sm,
    },
    checkedBox: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        padding: SPACING.md,
        alignItems: 'center',
    },
    footerText: {
        fontSize: FONT_SIZES.small,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});
