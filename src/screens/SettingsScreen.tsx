import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Alert, Platform } from 'react-native';
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
    Settings2,
    Highlighter,
    BellRing,
    LayoutGrid,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { clearCachedData, loadAllVerses, ProgressCallback, getStoredDataVersion, CURRENT_VERSION } from '@/data/quranData';
import { AppHeader } from '@/components/AppHeader';
import { ReciterSelector } from '@/components/ReciterSelector';
import { QuickThemeSetting } from '@/components/QuickThemeSetting';
import { CollapsibleSettingsSection } from '@/components/CollapsibleSettingsSection';
import { SettingItem } from '@/components/SettingItem';
import { ArabicFontPicker } from '@/components/ArabicFontPicker';
import { TranslationsSection } from '@/components/TranslationsSection';
import { DataUpdateSection } from '@/components/DataUpdateSection';
import { SPACING } from '@/theme';
import { isPrayerNotificationSupported } from '@/services/prayerTimes';
import { WidgetSettingsSection } from '@/components/WidgetSettingsSection';

interface SettingsScreenProps {
    navigation: any;
    /** Opened from the new data prompt: start downloading right away (already confirmed there) */
    startDataUpdate?: boolean;
}

const COLORS = {
    audio: '#F59E0B',
    wordTracking: '#22C55E',
    display: '#3B82F6',
    transliteration: '#8B5CF6',
    wordTranslations: '#10B981',
    inlineWordTranslations: '#F97316',
    wordRoots: '#84CC16',
    paginatedView: '#0EA5E9',
    verseNumbers: '#EC4899',
    fonts: '#14B8A6',
    translations: '#6366F1',
    system: '#64748B',
    prayerNotifications: '#14B8A6',
    widgets: '#0EA5E9',
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation, startDataUpdate }) => {
    const { settings, updateSettings, availableTranslations } = useSettings();
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    // Word roots only show up in the word translation views: without either one the switch is off and locked
    // (the saved choice is kept, so it is back as before once a view is turned on again)
    const wordViewsOff = !settings.showWordTranslations && !settings.inlineWordTranslations;
    const styles = useTheme().common;
    const THEME_TOGGLE_LABELS = {
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
        widgets: false,
        system: !!startDataUpdate,
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
            setDataVersion(CURRENT_VERSION);

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

    const scrollRef = React.useRef<ScrollView>(null);

    // Opened from the new data prompt on the main screen: the system section is open, show its progress
    React.useEffect(() => {
        if (!startDataUpdate) return;
        runUpdate();
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateData = () => {
        const message = t('settingsScreen.updateData.message');

        if (Platform.OS === 'web') {
            const confirmed = (globalThis as any).confirm?.(message);
            if (confirmed) {
                runUpdate();
            }
        } else {
            Alert.alert(t('settingsScreen.updateData.title'), message, [
                { text: t('settingsScreen.updateData.cancel'), style: 'cancel' },
                { text: t('settingsScreen.updateData.confirm'), style: 'destructive', onPress: runUpdate }
            ]);
        }
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
                ref={scrollRef}
                style={common.flex1}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }}
            >
                <QuickThemeSetting labels={THEME_TOGGLE_LABELS} />

                <CollapsibleSettingsSection
                    title={t('settingsScreen.sections.audioTitle')}
                    subtitle={t('settingsScreen.sections.audioSubtitle')}
                    icon={Volume2}
                    color={COLORS.audio}
                    expanded={expandedSections.audio}
                    onToggle={() => toggleSection('audio')}
                >
                    <SettingItem
                        title={t('settingsScreen.items.autoplayTitle')}
                        description={t('settingsScreen.items.autoplayDescription')}
                        value={settings.autoplayEnabled}
                        onValueChange={(value) => updateSettings({ autoplayEnabled: value })}
                        icon={<Repeat size={17} color={COLORS.audio} />}
                        iconColor={COLORS.audio}
                        theme={theme}
                    />
                    <SettingItem
                        title={t('settingsScreen.items.wordTrackingTitle')}
                        description={t('settingsScreen.items.wordTrackingDescription')}
                        warning={t('settingsScreen.items.wordTrackingWarning')}
                        value={settings.wordTrackingEnabled}
                        onValueChange={(value) => updateSettings({ wordTrackingEnabled: value })}
                        icon={<Highlighter size={17} color={COLORS.wordTracking} />}
                        iconColor={COLORS.wordTracking}
                        theme={theme}
                    />
                    <ReciterSelector />
                </CollapsibleSettingsSection>

                <CollapsibleSettingsSection
                    title={t('settingsScreen.sections.displayTitle')}
                    subtitle={t('settingsScreen.sections.displaySubtitle')}
                    icon={Eye}
                    color={COLORS.display}
                    expanded={expandedSections.display}
                    onToggle={() => toggleSection('display')}
                >
                    <SettingItem
                        title={t('settingsScreen.items.transliterationTitle')}
                        description={t('settingsScreen.items.transliterationDescription')}
                        value={settings.showTransliteration}
                        onValueChange={(value) => updateSettings({ showTransliteration: value })}
                        icon={<PenLine size={16} color={COLORS.transliteration} />}
                        iconColor={COLORS.transliteration}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.wordTranslationsTitle')}
                        description={t('settingsScreen.items.wordTranslationsDescription')}
                        value={settings.showWordTranslations}
                        onValueChange={(value) => updateSettings({ showWordTranslations: value })}
                        icon={<Type size={16} color={COLORS.wordTranslations} />}
                        iconColor={COLORS.wordTranslations}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.inlineWordTranslationsTitle')}
                        description={t('settingsScreen.items.inlineWordTranslationsDescription')}
                        warning={t('settingsScreen.items.inlineWordTranslationsWarning')}
                        value={settings.inlineWordTranslations}
                        onValueChange={(value) => updateSettings({ inlineWordTranslations: value })}
                        icon={<MousePointerClick size={16} color={COLORS.inlineWordTranslations} />}
                        iconColor={COLORS.inlineWordTranslations}
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
                        icon={<Sprout size={16} color={COLORS.wordRoots} />}
                        iconColor={COLORS.wordRoots}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.paginatedViewTitle')}
                        description={t('settingsScreen.items.paginatedViewDescription')}
                        value={settings.usePaginatedView}
                        onValueChange={(value) => updateSettings({ usePaginatedView: value })}
                        icon={<FileText size={16} color={COLORS.paginatedView} />}
                        iconColor={COLORS.paginatedView}
                        theme={theme}
                    />

                    <SettingItem
                        title={t('settingsScreen.items.arabicVerseNumbersTitle')}
                        description={t('settingsScreen.items.arabicVerseNumbersDescription')}
                        value={settings.verseNumberStyle === 'arabic'}
                        onValueChange={(value) => updateSettings({ verseNumberStyle: value ? 'arabic' : 'latin' })}
                        icon={<Hash size={16} color={COLORS.verseNumbers} />}
                        iconColor={COLORS.verseNumbers}
                        theme={theme}
                    />
                </CollapsibleSettingsSection>

                <CollapsibleSettingsSection
                    title={t('settingsScreen.sections.fontsTitle')}
                    subtitle={t('settingsScreen.sections.fontsSubtitle')}
                    icon={PenTool}
                    color={COLORS.fonts}
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
                    color={COLORS.translations}
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

                {/* Prayer time notifications are Android only (modules/prayer-notification) */}
                {isPrayerNotificationSupported() && (
                    <CollapsibleSettingsSection
                        link
                        title={t('prayerNotifications.title')}
                        subtitle={t('prayerNotifications.menuDescription')}
                        icon={BellRing}
                        color={COLORS.prayerNotifications}
                        onToggle={() => navigation.navigate('PrayerNotificationSettings')}
                    />
                )}

                {/* Home screen widgets are Android only, like the notifications (same native module) */}
                {isPrayerNotificationSupported() && (
                    <CollapsibleSettingsSection
                        title={t('widgets.sectionTitle')}
                        subtitle={t('widgets.sectionSubtitle')}
                        icon={LayoutGrid}
                        color={COLORS.widgets}
                        expanded={expandedSections.widgets}
                        onToggle={() => toggleSection('widgets')}
                    >
                        <WidgetSettingsSection />
                    </CollapsibleSettingsSection>
                )}

                <CollapsibleSettingsSection
                    title={t('settingsScreen.sections.systemTitle')}
                    subtitle={t('settingsScreen.sections.systemSubtitle')}
                    icon={Settings2}
                    color={COLORS.system}
                    expanded={expandedSections.system}
                    onToggle={() => toggleSection('system')}
                >
                    <DataUpdateSection
                        isUpdating={isUpdating}
                        isUpToDate={dataVersion === CURRENT_VERSION}
                        downloadProgress={downloadProgress}
                        downloadStatus={downloadStatus}
                        downloadedBytes={downloadedBytes}
                        totalBytes={totalBytes}
                        onUpdate={handleUpdateData}
                    />
                </CollapsibleSettingsSection>
            </ScrollView>
        </SafeAreaView>
    );
};
