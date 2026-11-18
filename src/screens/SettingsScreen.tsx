import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Alert } from 'react-native';
import {
    Volume2,
    Repeat,
    Eye,
    PenLine,
    Type,
    MousePointerClick,
    Sprout,
    FileText,
    Hash,
    PenTool,
    Languages,
    HardDrive,
    Highlighter,
    BellRing,
    LayoutGrid,
    BookOpenText,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getStoredDataVersion } from '@/data/quranData';
import { AppHeader } from '@/components/AppHeader';
import { ReciterSelector } from '@/components/ReciterSelector';
import { QuickThemeSetting } from '@/components/QuickThemeSetting';
import { CollapsibleSettingsSection } from '@/components/CollapsibleSettingsSection';
import { SettingItem } from '@/components/SettingItem';
import { ArabicFontPicker } from '@/components/ArabicFontPicker';
import { TranslationsSection } from '@/components/TranslationsSection';
import { SPACING } from '@/theme';
import { isPrayerNotificationSupported } from '@/services/prayerTimes';
import { WidgetSettingsSection } from '@/components/WidgetSettingsSection';
import { TafsirSettingsSection } from '@/components/TafsirSettingsSection';

interface SettingsScreenProps {
    navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { settings, updateSettings, availableTranslations } = useSettings();
    const { theme, common } = useTheme();
    // Every settings icon takes the app's ink green; the section titles already tell them apart
    const iconColor = theme.iconPrimary;
    const { t } = useTranslation();
    // Word roots only show up in the word translation views: without either one the switch is off and locked
    // (the saved choice is kept, so it is back as before once a view is turned on again)
    const wordViewsOff = !settings.showWordTranslations && !settings.inlineWordTranslations;
    const styles = useTheme().common;
    const THEME_TOGGLE_LABELS = {
        system: t('settingsScreen.theme.system'),
        light: t('settingsScreen.theme.light'),
        dark: t('settingsScreen.theme.dark'),
        lightsOut: t('settingsScreen.theme.lightsOut'),
        accessibilityLabel: (current: string, next: string) => t('settingsScreen.theme.accessibilityLabel', { current, next }),
    };
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        audio: false,
        display: false,
        fonts: false,
        translations: false,
        tafsir: false,
        widgets: false,
    });
    const [dataVersion, setDataVersion] = useState<string | null>(null);

    React.useEffect(() => {
        const checkVersion = async () => {
            const version = await getStoredDataVersion();
            setDataVersion(version);
        };
        checkVersion();
    }, []);

    const filteredTranslations = React.useMemo(() => {
        if (dataVersion && parseFloat(dataVersion) >= 3.1) {
            return availableTranslations;
        }
        // Filter out Kurdish translations if version < 3.1
        return availableTranslations.filter(name =>
            name !== 'Diyanet İşleri Kürtçe Meali (Latin)' &&
            name !== 'Diyanet İşleri Kürtçe Meali (Arapça)' &&
            name !== 'Ömer Çelik Meali'
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
            newTranslations = currentTranslations.filter((name: string) => name !== translationName);

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

    const toggleFavoriteTranslation = (translationName: string) => {
        if (settings.favoriteTranslation === translationName) {
            const newFavorite = settings.selectedTranslations[0];
            updateSettings({ favoriteTranslation: newFavorite });
        } else {
            updateSettings({ favoriteTranslation: translationName });
        }
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

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={t('settingsScreen.title')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView
                style={common.flex1}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }}
            >
                <QuickThemeSetting labels={THEME_TOGGLE_LABELS} />

                <CollapsibleSettingsSection
                    title={t('settingsScreen.sections.audioTitle')}
                    subtitle={t('settingsScreen.sections.audioSubtitle')}
                    icon={Volume2}
                    color={iconColor}
                    expanded={expandedSections.audio}
                    onToggle={() => toggleSection('audio')}
                >
                    <SettingItem
                        title={t('settingsScreen.items.autoplayTitle')}
                        description={t('settingsScreen.items.autoplayDescription')}
                        value={settings.autoplayEnabled}
                        onValueChange={(value) => updateSettings({ autoplayEnabled: value })}
                        icon={<Repeat size={17} color={iconColor} />}
                        iconColor={iconColor}
                        theme={theme}
                    />
                    <SettingItem
                        title={t('settingsScreen.items.wordTrackingTitle')}
                        description={t('settingsScreen.items.wordTrackingDescription')}
                        warning={t('settingsScreen.items.wordTrackingWarning')}
                        value={settings.wordTrackingEnabled}
                        onValueChange={(value) => updateSettings({ wordTrackingEnabled: value })}
                        icon={<Highlighter size={17} color={iconColor} />}
                        iconColor={iconColor}
                        theme={theme}
                    />
                    <ReciterSelector />
                </CollapsibleSettingsSection>

                <CollapsibleSettingsSection
                    title={t('settingsScreen.sections.displayTitle')}
                    subtitle={t('settingsScreen.sections.displaySubtitle')}
                    icon={Eye}
                    color={iconColor}
                    expanded={expandedSections.display}
                    onToggle={() => toggleSection('display')}
                >
                    <SettingItem
                        title={t('settingsScreen.items.transliterationTitle')}
                        description={t('settingsScreen.items.transliterationDescription')}
                        value={settings.showTransliteration}
                        onValueChange={(value) => updateSettings({ showTransliteration: value })}
                        icon={<PenLine size={16} color={iconColor} />}
                        iconColor={iconColor}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.wordTranslationsTitle')}
                        description={t('settingsScreen.items.wordTranslationsDescription')}
                        value={settings.showWordTranslations}
                        onValueChange={(value) => updateSettings({ showWordTranslations: value })}
                        icon={<Type size={16} color={iconColor} />}
                        iconColor={iconColor}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.inlineWordTranslationsTitle')}
                        description={t('settingsScreen.items.inlineWordTranslationsDescription')}
                        warning={t('settingsScreen.items.inlineWordTranslationsWarning')}
                        value={settings.inlineWordTranslations}
                        onValueChange={(value) => updateSettings({ inlineWordTranslations: value })}
                        icon={<MousePointerClick size={16} color={iconColor} />}
                        iconColor={iconColor}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.wordRootsTitle')}
                        description={t('settingsScreen.items.wordRootsDescription')}
                        warning={wordViewsOff ? t('settingsScreen.items.wordRootsWarning') : undefined}
                        warningTone="error"
                        disabled={wordViewsOff}
                        value={settings.showWordRoots && !wordViewsOff}
                        onValueChange={(value) => updateSettings({ showWordRoots: value })}
                        icon={<Sprout size={16} color={iconColor} />}
                        iconColor={iconColor}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.paginatedViewTitle')}
                        description={t('settingsScreen.items.paginatedViewDescription')}
                        value={settings.usePaginatedView}
                        onValueChange={(value) => updateSettings({ usePaginatedView: value })}
                        icon={<FileText size={16} color={iconColor} />}
                        iconColor={iconColor}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.arabicVerseNumbersTitle')}
                        description={t('settingsScreen.items.arabicVerseNumbersDescription')}
                        value={settings.verseNumberStyle === 'arabic'}
                        onValueChange={(value) => updateSettings({ verseNumberStyle: value ? 'arabic' : 'latin' })}
                        icon={<Hash size={16} color={iconColor} />}
                        iconColor={iconColor}
                        theme={theme}
                    />
                </CollapsibleSettingsSection>

                <CollapsibleSettingsSection
                    title={t('settingsScreen.sections.fontsTitle')}
                    subtitle={t('settingsScreen.sections.fontsSubtitle')}
                    icon={PenTool}
                    color={iconColor}
                    expanded={expandedSections.fonts}
                    onToggle={() => toggleSection('fonts')}
                >
                    <ArabicFontPicker settings={settings} updateSettings={updateSettings} />
                </CollapsibleSettingsSection>

                <CollapsibleSettingsSection
                    title={t('settingsScreen.sections.translationsTitle')}
                    subtitle={t('settingsScreen.sections.translationsSubtitle', {
                        count: settings.selectedTranslations.length,
                        favorite: `${settings.favoriteTranslation.substring(0, 20)}${settings.favoriteTranslation.length > 20 ? '...' : ''}`,
                    })}
                    icon={Languages}
                    color={iconColor}
                    expanded={expandedSections.translations}
                    onToggle={() => toggleSection('translations')}
                >
                    <TranslationsSection
                        translations={filteredTranslations}
                        selectedTranslations={settings.selectedTranslations}
                        favoriteTranslation={settings.favoriteTranslation}
                        onToggleTranslation={toggleTranslation}
                        onToggleFavorite={toggleFavoriteTranslation}
                        onSelectAll={selectAllTranslations}
                        onSelectDefault={selectDefaultTranslations}
                    />
                </CollapsibleSettingsSection>

                <CollapsibleSettingsSection
                    title={t('tafsir.settingsTitle')}
                    subtitle={t('tafsir.settingsSubtitle')}
                    icon={BookOpenText}
                    color={iconColor}
                    expanded={expandedSections.tafsir}
                    onToggle={() => toggleSection('tafsir')}
                >
                    <TafsirSettingsSection />
                </CollapsibleSettingsSection>

                {/* Prayer time notifications need the native module (modules/prayer-notification): Android and iOS */}
                {isPrayerNotificationSupported() && (
                    <CollapsibleSettingsSection
                        link
                        title={t('prayerNotifications.title')}
                        subtitle={t('prayerNotifications.menuDescription')}
                        icon={BellRing}
                        color={iconColor}
                        onToggle={() => navigation.navigate('PrayerNotificationSettings')}
                    />
                )}

                {/* Home screen widgets come from the same native module as the notifications */}
                {isPrayerNotificationSupported() && (
                    <CollapsibleSettingsSection
                        title={t('widgets.sectionTitle')}
                        subtitle={t('widgets.sectionSubtitle')}
                        icon={LayoutGrid}
                        color={iconColor}
                        expanded={expandedSections.widgets}
                        onToggle={() => toggleSection('widgets')}
                    >
                        <WidgetSettingsSection />
                    </CollapsibleSettingsSection>
                )}

                <CollapsibleSettingsSection
                    title={t('dataManagement.settingsTitle')}
                    subtitle={t('dataManagement.settingsSubtitle')}
                    icon={HardDrive}
                    color={iconColor}
                    onToggle={() => navigation.navigate('DataManagement')}
                    link
                />
            </ScrollView>
        </SafeAreaView>
    );
};
