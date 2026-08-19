import React, { useState, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Platform,
    Animated,
} from 'react-native';
import { ThemeToggle } from '@msarinc/ui';
import { useTranslation } from 'react-i18next';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { ARABIC_FONT_OPTIONS } from '../constants/fonts';
import { useTheme } from '../contexts/ThemeContext';
import { clearCachedData, loadAllVerses, ProgressCallback, getStoredDataVersion } from '../data/quranData';
import { AppHeader } from '../components/AppHeader'; // Use AppHeader
import { AppButton } from '../components/AppButton'; // Use AppButton if needed
import { ReciterSelector } from '../components/ReciterSelector';
import { DataUpdateProgress } from '../components/DataUpdateProgress';
import { FONT_SIZES, SPACING } from '../theme'; // Import from theme

interface SettingsScreenProps {
    navigation: any;
}

interface ModernSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    theme: any; // Using any for now to avoid circular deps or just simplify if Theme is globally available via context return type
}

const ModernSwitch: React.FC<ModernSwitchProps> = ({
    value,
    onValueChange,
    disabled = false,
    theme
}) => {
    const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

    React.useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value, animatedValue]);

    const handlePress = () => {
        if (!disabled) {
            onValueChange(!value);
        }
    };

    const trackColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [
            disabled ? 'rgba(128, 128, 128, 0.25)' : 'rgba(128, 128, 128, 0.5)',
            disabled ? 'rgba(86, 163, 90, 0.38)' : theme.primary
        ],
    });

    const thumbTranslate = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22],
    });

    const thumbScale = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });

    if (Platform.OS === 'web') {
        // Use native Switch on web for better compatibility
        return (
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{
                    false: disabled ? theme.border + '40' : theme.border + '60',
                    true: disabled ? theme.primary + '60' : theme.primary
                }}
                thumbColor={value ? '#FFFFFF' : theme.text}
                disabled={disabled}
                style={createStyles(theme).webSwitch}
            />
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            disabled={disabled}
            style={createStyles(theme).modernSwitchContainer}
        >
            <Animated.View
                style={[
                    createStyles(theme).modernSwitchTrack,
                    { backgroundColor: trackColor },
                    disabled && createStyles(theme).modernSwitchDisabled
                ]}
            >
                <Animated.View
                    style={[
                        createStyles(theme).modernSwitchThumb,
                        {
                            transform: [
                                { translateX: thumbTranslate },
                                { scale: thumbScale }
                            ]
                        },
                        value && createStyles(theme).modernSwitchThumbActive
                    ]}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

interface SettingItemProps {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon?: string;
    theme: any;
    disabled?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
    title,
    description,
    value,
    onValueChange,
    icon,
    theme,
    disabled = false
}) => (
    <View style={[createStyles(theme).settingItem, disabled && createStyles(theme).settingItemDisabled]}>
        <View style={createStyles(theme).settingContent}>
            {icon && <Text style={createStyles(theme).settingIcon}>{icon}</Text>}
            <View style={createStyles(theme).settingInfo}>
                <Text style={[createStyles(theme).settingLabel, disabled && createStyles(theme).settingLabelDisabled]}>
                    {title}
                </Text>
                <Text style={[createStyles(theme).settingDescription, disabled && createStyles(theme).settingDescriptionDisabled]}>
                    {description}
                </Text>
            </View>
        </View>
        <ModernSwitch
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            theme={theme}
        />
    </View>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { settings, updateSettings, availableTranslations, availableReciters } = useDebouncedSettings(150);
    const { theme } = useTheme();
    const { t } = useTranslation();
    const THEME_TOGGLE_LABELS = {
        light: t('settingsScreen.theme.light'),
        dark: t('settingsScreen.theme.dark'),
        lightsOut: t('settingsScreen.theme.lightsOut'),
        accessibilityLabel: (current: string, next: string) => t('settingsScreen.theme.accessibilityLabel', { current, next }),
    };
    const { width: screenWidth } = useWindowDimensions();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        audio: false,
        display: false,
        fonts: false,
        translations: false,
        system: false,
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('');
    const [downloadedBytes, setDownloadedBytes] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [dataVersion, setDataVersion] = useState<string | null>(null);

    React.useEffect(() => {
        const checkVersion = async () => {
            const version = await getStoredDataVersion();
            setDataVersion(version);
        };
        checkVersion();
    }, []);

    const filteredTranslations = React.useMemo(() => {
        if (dataVersion === '3.1') {
            return availableTranslations;
        }
        // Filter out Kurdish translations if version < 3.1
        return availableTranslations.filter(t =>
            t !== 'Diyanet İşleri Kürtçe Meali (Latin)' &&
            t !== 'Diyanet İşleri Kürtçe Meali (Arapça)' &&
            t !== 'Ömer Çelik Meali'
        );
    }, [availableTranslations, dataVersion]);

    const toggleSection = (sectionKey: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const toggleTranslation = (translationName: string) => {
        const currentTranslations = settings.selectedTranslations;
        let newTranslations;
        let newFavorite = settings.favoriteTranslation;

        if (currentTranslations.includes(translationName)) {
            if (currentTranslations.length <= 1) {
                Alert.alert(
                    t('settingsScreen.minSelectedTranslationTitle'),
                    t('settingsScreen.minSelectedTranslationMessage'),
                    [{ text: t('settingsScreen.ok'), style: 'default' }]
                );
                return;
            }
            newTranslations = currentTranslations.filter((t: string) => t !== translationName);

            // Eğer kaldırılan meal favori ise, yeni favori belirle
            if (settings.favoriteTranslation === translationName) {
                newFavorite = newTranslations[0]; // İlk kalan meal'i favori yap
            }
        } else {
            newTranslations = [...currentTranslations, translationName];
        }

        updateSettings({
            selectedTranslations: newTranslations,
            favoriteTranslation: newFavorite
        });
    };

    const selectAllTranslations = () => {
        updateSettings({ selectedTranslations: [...filteredTranslations] });
    };

    const selectDefaultTranslations = () => {
        updateSettings({
            selectedTranslations: [
                'Kur\'an Yolu (Diyanet İşleri)',
                'Elmalılı Meali (Orijinal)',
                'Ali Bulaç Meali'
            ]
        });
    };

    const handleUpdateData = () => {
        const title = t('settingsScreen.updateData.title');
        const message = t('settingsScreen.updateData.message');

        const runUpdate = async () => {
            setIsUpdating(true);
            setDownloadProgress(0);
            setDownloadStatus(t('settingsScreen.updateData.preparing'));

            const progressCallback: ProgressCallback = (progress, status, downloaded, total) => {
                setDownloadProgress(progress);
                setDownloadStatus(status);
                if (downloaded !== undefined) setDownloadedBytes(downloaded);
                if (total !== undefined) setTotalBytes(total);
            };

            try {
                await clearCachedData();
                await loadAllVerses(progressCallback);
                setIsUpdating(false);

                // Logically update dataVersion state after successful update
                setDataVersion('3.1');

                if (Platform.OS === 'web') {
                    setTimeout(() => {
                        const win: any = globalThis;
                        if (win.window?.location) win.window.location.reload();
                    }, 500);
                } else {
                    Alert.alert(t('settingsScreen.updateData.successTitle'), t('settingsScreen.updateData.successMessage'));
                }
            } catch (error) {
                console.error('Update failed:', error);
                setIsUpdating(false);
                setDownloadStatus(t('settingsScreen.updateData.errorPrefix') + (error as Error).message);
                Alert.alert(t('settingsScreen.updateData.errorTitle'), t('settingsScreen.updateData.errorMessage'));
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = (globalThis as any).confirm?.(message);
            if (confirmed) {
                runUpdate();
            }
        } else {
            Alert.alert(title, message, [
                { text: t('settingsScreen.updateData.cancel'), style: 'cancel' },
                { text: t('settingsScreen.updateData.confirm'), style: 'destructive', onPress: runUpdate }
            ]);
        }
    };

    const renderSectionHeader = (title: string, subtitle: string, sectionKey: string, icon: string) => (
        <TouchableOpacity
            style={createStyles(theme).sectionHeader}
            onPress={() => toggleSection(sectionKey)}
            activeOpacity={0.8}
        >
            <View style={createStyles(theme).sectionHeaderContent}>
                <Text style={createStyles(theme).sectionIcon}>{icon}</Text>
                <View style={createStyles(theme).sectionHeaderText}>
                    <Text style={createStyles(theme).sectionTitle}>{title}</Text>
                    <Text style={createStyles(theme).sectionSubtitle}>{subtitle}</Text>
                </View>
            </View>
            <View style={[
                createStyles(theme).expandButton,
                expandedSections[sectionKey] && createStyles(theme).expandButtonActive
            ]}>
                <Text style={[
                    createStyles(theme).expandIcon,
                    expandedSections[sectionKey] && createStyles(theme).expandIconActive
                ]}>
                    {expandedSections[sectionKey] ? '▲' : '▼'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderTranslationItem = (translationName: string, index: number) => {
        const isSelected = settings.selectedTranslations.includes(translationName);
        const isFavorite = settings.favoriteTranslation === translationName;

        const toggleFavorite = () => {
            if (isFavorite) {
                // Favoriyi kaldır - ilk seçili meal'i favori yap
                const newFavorite = settings.selectedTranslations[0];
                updateSettings({ favoriteTranslation: newFavorite });
            } else {
                updateSettings({ favoriteTranslation: translationName });
            }
        };

        return (
            <View
                key={translationName}
                style={[
                    createStyles(theme).translationItem,
                    isSelected && createStyles(theme).selectedTranslationItem,
                    isFavorite && createStyles(theme).favoriteTranslationItem,
                    index === 0 && createStyles(theme).firstTranslationItem,
                    index === filteredTranslations.length - 1 && createStyles(theme).lastTranslationItem
                ]}
            >
                <TouchableOpacity
                    style={createStyles(theme).translationMainContent}
                    onPress={() => toggleTranslation(translationName)}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        createStyles(theme).translationText,
                        isSelected && createStyles(theme).selectedTranslationText,
                        isFavorite && createStyles(theme).favoriteTranslationText
                    ]}>
                        {translationName}
                    </Text>
                    <View style={[
                        createStyles(theme).modernCheckbox,
                        isSelected && createStyles(theme).modernCheckboxSelected
                    ]}>
                        {isSelected && <Text style={createStyles(theme).modernCheckmark}>✓</Text>}
                    </View>
                </TouchableOpacity>

                {/* Favori Yıldızı */}
                {isSelected && (
                    <TouchableOpacity
                        style={createStyles(theme).favoriteButton}
                        onPress={toggleFavorite}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            createStyles(theme).favoriteIcon,
                            isFavorite && createStyles(theme).favoriteIconActive
                        ]}>
                            {isFavorite ? '★' : '☆'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={createStyles(theme).container}>
            <AppHeader
                title={t('settingsScreen.title')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView
                style={createStyles(theme).content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={createStyles(theme).scrollContent}
            >
                {/* Quick Settings - Always visible */}
                <View style={createStyles(theme).quickSettingsSection}>
                    <Text style={createStyles(theme).quickSettingsTitle}>{t('settingsScreen.quickSettings')}</Text>
                    <View style={createStyles(theme).settingItem}>
                        <View style={createStyles(theme).settingContent}>
                            <Text style={createStyles(theme).settingIcon}>🌙</Text>
                            <View style={createStyles(theme).settingInfo}>
                                <Text style={createStyles(theme).settingLabel}>{t('settingsScreen.themeLabel')}</Text>
                                <Text style={createStyles(theme).settingDescription}>{t('settingsScreen.themeDescription')}</Text>
                            </View>
                        </View>
                        <ThemeToggle labels={THEME_TOGGLE_LABELS} compact={false} />
                    </View>
                </View>

                {/* Audio Settings */}
                <View style={createStyles(theme).section}>
                    {renderSectionHeader(
                        t('settingsScreen.sections.audioTitle'),
                        t('settingsScreen.sections.audioSubtitle'),
                        "audio",
                        "🔊"
                    )}

                    {expandedSections.audio && (
                        <View style={createStyles(theme).sectionContent}>
                            <SettingItem
                                title={t('settingsScreen.items.autoplayTitle')}
                                description={t('settingsScreen.items.autoplayDescription')}
                                value={settings.autoplayEnabled}
                                onValueChange={(value) => updateSettings({ autoplayEnabled: value })}
                                icon="⏯️"
                                theme={theme}
                            />

                            <View style={createStyles(theme).reciterContainer}>
                                <ReciterSelector />
                            </View>
                        </View>
                    )}
                </View>

                {/* Display Settings */}
                <View style={createStyles(theme).section}>
                    {renderSectionHeader(
                        t('settingsScreen.sections.displayTitle'),
                        t('settingsScreen.sections.displaySubtitle'),
                        "display",
                        "👁️"
                    )}

                    {expandedSections.display && (
                        <View style={createStyles(theme).sectionContent}>
                            <SettingItem
                                title={t('settingsScreen.items.transliterationTitle')}
                                description={t('settingsScreen.items.transliterationDescription')}
                                value={settings.showTransliteration}
                                onValueChange={(value) => updateSettings({ showTransliteration: value })}
                                icon="📝"
                                theme={theme}
                            />

                            <SettingItem
                                title={t('settingsScreen.items.wordTranslationsTitle')}
                                description={t('settingsScreen.items.wordTranslationsDescription')}
                                value={settings.showWordTranslations}
                                onValueChange={(value) => {
                                    if (value && settings.inlineWordTranslations) {
                                        updateSettings({ showWordTranslations: value, inlineWordTranslations: false });
                                    } else {
                                        updateSettings({ showWordTranslations: value });
                                    }
                                }}
                                icon="🔤"
                                theme={theme}
                                disabled={settings.inlineWordTranslations}
                            />

                            <SettingItem
                                title={t('settingsScreen.items.inlineWordTranslationsTitle')}
                                description={t('settingsScreen.items.inlineWordTranslationsDescription')}
                                value={settings.inlineWordTranslations}
                                onValueChange={(value) => {
                                    if (value && settings.showWordTranslations) {
                                        updateSettings({ inlineWordTranslations: value, showWordTranslations: false });
                                    } else {
                                        updateSettings({ inlineWordTranslations: value });
                                    }
                                }}
                                icon="🖱️"
                                theme={theme}
                                disabled={settings.showWordTranslations}
                            />

                            <SettingItem
                                title={t('settingsScreen.items.paginatedViewTitle')}
                                description={t('settingsScreen.items.paginatedViewDescription')}
                                value={settings.usePaginatedView}
                                onValueChange={(value) => updateSettings({ usePaginatedView: value })}
                                icon="📄"
                                theme={theme}
                            />
                        </View>
                    )}
                </View>

                {/* Font Selection */}
                <View style={createStyles(theme).section}>
                    {renderSectionHeader(
                        t('settingsScreen.sections.fontsTitle'),
                        t('settingsScreen.sections.fontsSubtitle'),
                        "fonts",
                        "✍️"
                    )}
                    {expandedSections.fonts && (() => {
                        // Section padding ~32px each side + sectionContent padding ~16px = ~96px total
                        const available = screenWidth - 96;
                        const gap = SPACING.sm; // 8px
                        const minChipW = 90;
                        // How many chips fit per row?
                        const rawPerRow = Math.floor((available + gap) / (minChipW + gap));
                        const perRow = Math.max(2, rawPerRow);
                        // How many rows?
                        const total = ARABIC_FONT_OPTIONS.length;
                        const numRows = Math.ceil(total / perRow);
                        // Redistribute evenly: make all rows same size if possible
                        const evenPerRow = Math.ceil(total / numRows);
                        // Split into rows
                        const rows: typeof ARABIC_FONT_OPTIONS[] = [];
                        for (let i = 0; i < total; i += evenPerRow) {
                            rows.push(ARABIC_FONT_OPTIONS.slice(i, i + evenPerRow));
                        }
                        const chipWidth = (available - (evenPerRow - 1) * gap) / evenPerRow;

                        return (
                            <View style={createStyles(theme).sectionContent}>
                                {[
                                    { key: 'arabicFont' as const, icon: '📖', label: t('settingsScreen.fonts.readingFont') },
                                    { key: 'imageArabicFont' as const, icon: '🖼️', label: t('settingsScreen.fonts.imageFont') },
                                ].map(({ key, icon, label }, groupIdx) => (
                                    <View key={key} style={{ marginBottom: groupIdx === 0 ? SPACING.lg : 0 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.xs }}>
                                            <Text style={{ fontSize: 13 }}>{icon}</Text>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, letterSpacing: 0.3 }}>
                                                {label}
                                            </Text>
                                        </View>
                                        {rows.map((row, rowIdx) => (
                                            <View key={rowIdx} style={{ flexDirection: 'row', gap, marginBottom: rowIdx < rows.length - 1 ? gap : 0 }}>
                                                {row.map(font => {
                                                    const isSelected = settings[key] === font.id;
                                                    return (
                                                        <TouchableOpacity
                                                            key={font.id}
                                                            onPress={() => updateSettings({ [key]: font.id })}
                                                            style={[
                                                                createStyles(theme).fontChip,
                                                                { width: chipWidth },
                                                                isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
                                                            ]}
                                                        >
                                                            <Text style={[createStyles(theme).fontChipArabic, { fontFamily: Platform.OS === 'web' ? font.css : undefined, color: isSelected ? '#fff' : theme.text }]}>
                                                                {font.labelAr}
                                                            </Text>
                                                            <Text style={[createStyles(theme).fontChipLabel, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>
                                                                {font.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        );
                    })()}
                </View>

                {/* Translation Selection */}
                <View style={createStyles(theme).section}>
                    {renderSectionHeader(
                        t('settingsScreen.sections.translationsTitle'),
                        t('settingsScreen.sections.translationsSubtitle', {
                            count: settings.selectedTranslations.length,
                            favorite: `${settings.favoriteTranslation.substring(0, 20)}${settings.favoriteTranslation.length > 20 ? '...' : ''}`,
                        }),
                        "translations",
                        "📖"
                    )}

                    {expandedSections.translations && (
                        <View style={createStyles(theme).sectionContent}>
                            <View style={createStyles(theme).translationActions}>
                                <TouchableOpacity
                                    style={[createStyles(theme).actionButton, createStyles(theme).primaryActionButton]}
                                    onPress={selectAllTranslations}
                                >
                                    <Text style={createStyles(theme).primaryActionButtonText}>{t('settingsScreen.translations.selectAll')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[createStyles(theme).actionButton, createStyles(theme).secondaryActionButton]}
                                    onPress={selectDefaultTranslations}
                                >
                                    <Text style={createStyles(theme).secondaryActionButtonText}>{t('settingsScreen.translations.selectDefault')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Favori Meal Açıklaması */}
                            <View style={createStyles(theme).favoriteExplanation}>
                                <Text style={createStyles(theme).favoriteExplanationText}>
                                    {t('settingsScreen.translations.favoriteExplanation')}
                                </Text>
                            </View>

                            <View style={createStyles(theme).translationsContainer}>
                                {filteredTranslations.map((translation, index) =>
                                    renderTranslationItem(translation, index)
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* System Settings */}
                <View style={createStyles(theme).section}>
                    {renderSectionHeader(
                        t('settingsScreen.sections.systemTitle'),
                        t('settingsScreen.sections.systemSubtitle'),
                        "system",
                        "⚙️"
                    )}

                    {expandedSections.system && (
                        <View style={createStyles(theme).sectionContent}>
                            {isUpdating ? (
                                <View style={{ padding: SPACING.lg }}>
                                    <DataUpdateProgress
                                        progress={downloadProgress}
                                        status={downloadStatus}
                                        downloadedBytes={downloadedBytes}
                                        totalBytes={totalBytes}
                                        theme={theme}
                                    />
                                </View>
                            ) : dataVersion === '3.1' ? (
                                <Text style={[createStyles(theme).footerText, { padding: SPACING.md, textAlign: 'center' }]}>
                                    {t('settingsScreen.dataUpToDate')}
                                </Text>
                            ) : (
                                <TouchableOpacity
                                    style={createStyles(theme).updateButton}
                                    onPress={handleUpdateData}
                                    activeOpacity={0.7}
                                >
                                    <Text style={createStyles(theme).updateButtonText}>{t('settingsScreen.updateButton')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                <View style={createStyles(theme).footer}>
                    <Text style={createStyles(theme).footerText}>
                        {t('settingsScreen.footer')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

import { createStyles } from './SettingsScreen.styles';

