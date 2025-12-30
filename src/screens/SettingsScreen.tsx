import React, { useState } from 'react';
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
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { useTheme } from '../contexts/ThemeContext';
import { AppHeader } from '../components/AppHeader'; // Use AppHeader
import { AppButton } from '../components/AppButton'; // Use AppButton if needed
import { ReciterSelector } from '../components/ReciterSelector';
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
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        audio: false,
        display: false,
        translations: false,
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
        let newFavorite = settings.favoriteTranslation;

        if (currentTranslations.includes(translationName)) {
            if (currentTranslations.length <= 1) {
                Alert.alert(
                    'Uyarı',
                    'En az bir meal seçili olmalıdır.',
                    [{ text: 'Tamam', style: 'default' }]
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
        updateSettings({ selectedTranslations: [...availableTranslations] });
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
                    index === availableTranslations.length - 1 && createStyles(theme).lastTranslationItem
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
                title="Ayarlar"
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
                    <Text style={createStyles(theme).quickSettingsTitle}>Hızlı Ayarlar</Text>
                    <SettingItem
                        title="Koyu Mod"
                        description="Karanlık tema kullan"
                        value={settings.darkMode}
                        onValueChange={(value) => updateSettings({ darkMode: value })}
                        icon="🌙"
                        theme={theme}
                    />
                </View>

                {/* Audio Settings */}
                <View style={createStyles(theme).section}>
                    {renderSectionHeader(
                        "Ses Ayarları",
                        "Otomatik oynatma ve kıraat seçimi",
                        "audio",
                        "🔊"
                    )}

                    {expandedSections.audio && (
                        <View style={createStyles(theme).sectionContent}>
                            <SettingItem
                                title="Otomatik Oynatma"
                                description="Bir ayet bitince otomatik olarak sonraki ayete geç"
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
                        "Görünüm Seçenekleri",
                        "Ayet görünümü ve kelime çevirileri",
                        "display",
                        "👁️"
                    )}

                    {expandedSections.display && (
                        <View style={createStyles(theme).sectionContent}>
                            <SettingItem
                                title="Türkçe Okunuş"
                                description="Ayetlerin okunuş şeklini göster"
                                value={settings.showTransliteration}
                                onValueChange={(value) => updateSettings({ showTransliteration: value })}
                                icon="📝"
                                theme={theme}
                            />

                            <SettingItem
                                title="Kelime Çevirileri"
                                description="Her kelimenin altında Türkçe karşılığını göster"
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
                                title="Kelime Üstüne Gelince Çeviri"
                                description="Web'de ayet içinde kelimenin üstüne gelince çeviriyi göster"
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
                                title="Sayfalı Görünüm"
                                description="Her ayeti ayrı sayfada göster (kaydırarak geçiş)"
                                value={settings.usePaginatedView}
                                onValueChange={(value) => updateSettings({ usePaginatedView: value })}
                                icon="📄"
                                theme={theme}
                            />
                        </View>
                    )}
                </View>

                {/* Translation Selection */}
                <View style={createStyles(theme).section}>
                    {renderSectionHeader(
                        "Meal Seçimi",
                        `${settings.selectedTranslations.length} meal seçili • Favori: ${settings.favoriteTranslation.substring(0, 20)}${settings.favoriteTranslation.length > 20 ? '...' : ''}`,
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
                                    <Text style={createStyles(theme).primaryActionButtonText}>Tümünü Seç</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[createStyles(theme).actionButton, createStyles(theme).secondaryActionButton]}
                                    onPress={selectDefaultTranslations}
                                >
                                    <Text style={createStyles(theme).secondaryActionButtonText}>Varsayılan</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Favori Meal Açıklaması */}
                            <View style={createStyles(theme).favoriteExplanation}>
                                <Text style={createStyles(theme).favoriteExplanationText}>
                                    ⭐ Favori meal ayetlerde öncelikli olarak gösterilir
                                </Text>
                            </View>

                            <View style={createStyles(theme).translationsContainer}>
                                {availableTranslations.map((translation, index) =>
                                    renderTranslationItem(translation, index)
                                )}
                            </View>
                        </View>
                    )}
                </View>

                <View style={createStyles(theme).footer}>
                    <Text style={createStyles(theme).footerText}>
                        💡 Seçili mealler ayetlerin altında gösterilecektir
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

import { createStyles } from './SettingsScreen.styles';

