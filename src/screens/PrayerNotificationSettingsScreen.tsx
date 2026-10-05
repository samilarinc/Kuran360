import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { View, Text, ScrollView, TouchableOpacity, Alert, AppState } from 'react-native';
import { AlarmClock, BellOff, BellRing, CalendarClock, CheckCircle2, ChevronDown, Landmark, Moon, Music, Plane, Play, Plus, Square, Trash2, UtensilsCrossed } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { ModernSwitch } from '@/components/ModernSwitch';
import { SettingItem } from '@/components/SettingItem';
import { CityPickerModal } from '@/components/CityPickerModal';
import { PRAYER_COLORS, PRAYER_ICONS } from '@/constants/prayerIcons';
import { PrayerTime } from '@/types';
import {
    ALERT_BEFORE_OPTIONS,
    BUILT_IN_SOUNDS,
    CUMA_BEFORE_OPTIONS,
    PRAYER_KEYS,
    PrayerNotificationSettings,
    SAHUR_BEFORE_OPTIONS,
    alertSoundUri,
    canScheduleExactAlarms,
    deleteAlertSound,
    detectPrayerLocation,
    fetchPrayerTimes,
    findPrayerDay,
    findPrayerLocation,
    formatLocationName,
    getMissedPrayers,
    getNotificationSettings,
    hasAnyNotification,
    hasNotificationPermission,
    importAlertSound,
    isPrayerNotificationSupported,
    isTravelModeOn,
    openExactAlarmSettings,
    requestNotificationPermission,
    saveNotificationSettings,
    setTravelMode,
    syncPrayerNotifications,
} from '@/services/prayerTimes';
import { createStyles } from './PrayerNotificationSettingsScreen.styles';

/** A row of choice pills; `format` labels each value */
const Pills = <T extends string | number>({ options, value, onChange, format }: {
    options: readonly T[];
    value: T;
    onChange: (value: T) => void;
    format: (value: T) => string;
}) => {
    const { common } = useTheme();
    const styles = useThemedStyles(createStyles);
    return (
        <View style={styles.pills}>
            {options.map(option => {
                const selected = option === value;
                return (
                    <TouchableOpacity key={String(option)} style={[styles.pill, selected && common.selected]} onPress={() => onChange(option)}>
                        <Text style={[styles.pillText, selected && common.buttonTextPrimary]}>{format(option)}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

/** Prayer time settings: travel mode, alerts and the ongoing countdown. Opened from Settings and the Prayer Times screen. */
export const PrayerNotificationSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { settings: appSettings, updateSettings } = useSettings();
    const [settings, setSettings] = useState<PrayerNotificationSettings | null>(null);
    const [today, setToday] = useState<PrayerTime | undefined>();
    const [exactAlarms, setExactAlarms] = useState(canScheduleExactAlarms);
    const [permission, setPermission] = useState(true);
    const [travelOn, setTravelOn] = useState(false);
    /** Prayer whose sound is being picked */
    const [soundPickerFor, setSoundPickerFor] = useState<number | null>(null);
    const [missed] = useState(getMissedPrayers);
    /** Sound from "Seslerim" being previewed */
    const [playing, setPlaying] = useState<string | null>(null);
    const previewRef = useRef<Audio.Sound | null>(null);

    const stopPreview = useCallback(async () => {
        const sound = previewRef.current;
        previewRef.current = null;
        setPlaying(null);
        await sound?.unloadAsync().catch(() => { });
    }, []);

    useEffect(() => () => { stopPreview(); }, [stopPreview]);

    const togglePreview = async (name: string) => {
        const wasPlaying = playing === name;
        await stopPreview();
        if (wasPlaying) return;
        try {
            const { sound } = await Audio.Sound.createAsync({ uri: alertSoundUri(name) }, { shouldPlay: true });
            previewRef.current = sound;
            setPlaying(name);
            sound.setOnPlaybackStatusUpdate(status => {
                if (status.isLoaded && status.didJustFinish && previewRef.current === sound) stopPreview();
            });
        } catch (error) {
            console.error('Error playing alert sound:', error);
        }
    };
    const supported = isPrayerNotificationSupported();
    const location = findPrayerLocation(appSettings.prayerLocation?.id);

    useEffect(() => {
        isTravelModeOn().then(setTravelOn);
        hasNotificationPermission().then(setPermission);
    }, []);

    useEffect(() => {
        getNotificationSettings().then(setSettings);
        fetchPrayerTimes(location)
            .then(times => setToday(findPrayerDay(times, new Date())))
            .catch(() => { });
    }, [location]);

    // Permissions are granted in the system settings; check again on return
    useEffect(() => {
        const subscription = AppState.addEventListener('change', state => {
            if (state !== 'active') return;
            setExactAlarms(canScheduleExactAlarms());
            hasNotificationPermission().then(setPermission);
        });
        return () => subscription.remove();
    }, []);

    const askPermission = async () => {
        const granted = await requestNotificationPermission();
        setPermission(granted);
        if (!granted) Alert.alert(t('prayerNotifications.permissionTitle'), t('prayerNotifications.permissionMessage'));
        return granted;
    };

    const update = useCallback(async (next: PrayerNotificationSettings) => {
        if (!settings) return;
        if (hasAnyNotification(next) && !permission && !(await askPermission())) return;
        setSettings(next);
        await saveNotificationSettings(next);
        try {
            await syncPrayerNotifications(location, t, i18n.language);
        } catch (error) {
            console.error('Error applying prayer notification settings:', error);
            Alert.alert(t('prayerTimesScreen.errorTitle'), t('prayerNotifications.errorMessage'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings, permission, location, t, i18n.language]);

    const updateAlert = (index: number, change: Partial<PrayerNotificationSettings['alerts'][number]>) => {
        if (!settings) return;
        update({ ...settings, alerts: settings.alerts.map((alert, i) => (i === index ? { ...alert, ...change } : alert)) });
    };

    /** Turning travel mode on looks the location up right away (asking for permission) */
    const toggleTravelMode = async (on: boolean) => {
        if (on) {
            try {
                const result = await detectPrayerLocation();
                if (result.status === 'denied') {
                    Alert.alert(t('prayerTimesScreen.permissionDeniedTitle'), t('prayerTimesScreen.permissionDeniedMessage'));
                    return;
                }
                if (result.status === 'notFound') {
                    Alert.alert(t('prayerTimesScreen.locationNotFoundTitle'), t('prayerTimesScreen.locationNotFoundMessage'));
                } else {
                    const found = result.location;
                    updateSettings({ prayerLocation: { id: found.id, cityName: found.cityName, districtName: found.districtName || null } });
                }
            } catch (error) {
                console.error('Error getting location:', error);
                Alert.alert(t('prayerTimesScreen.errorTitle'), t('prayerTimesScreen.locationErrorMessage'));
                return;
            }
        }
        await setTravelMode(on);
        setTravelOn(on);
    };

    const soundLabel = (sound: string) =>
        BUILT_IN_SOUNDS.includes(sound)
            ? t(`prayerNotifications.sounds.${sound}`)
            : settings?.sounds.find(entry => entry.name === sound)?.label ?? t('prayerNotifications.sounds.default');

    const addSound = async () => {
        if (!settings) return;
        try {
            const picked = await importAlertSound();
            if (picked) update({ ...settings, sounds: [...settings.sounds, picked] });
        } catch (error) {
            console.error('Error importing alert sound:', error);
            Alert.alert(t('prayerTimesScreen.errorTitle'), t('prayerNotifications.soundError'));
        }
    };

    /** Prayers set to a removed sound go back to the default */
    const removeSound = (name: string) => {
        if (!settings) return;
        if (playing === name) stopPreview();
        deleteAlertSound(name);
        update({
            ...settings,
            sounds: settings.sounds.filter(sound => sound.name !== name),
            alerts: settings.alerts.map(alert => (alert.sound === name ? { ...alert, sound: 'default' } : alert)),
        });
    };

    return (
        <View style={common.container}>
            <AppHeader
                title={t('prayerNotifications.title')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView contentContainerStyle={[common.pMd, common.pbXl]}>
                <Text style={styles.sectionTitle}>{t('prayerNotifications.locationTitle')}</Text>
                <View style={styles.card}>
                    <SettingItem
                        title={t('prayerTimesScreen.travelModeTitle')}
                        description={t('prayerTimesScreen.travelModeDescription')}
                        value={travelOn}
                        onValueChange={toggleTravelMode}
                        icon={<Plane size={20} color="#0891B2" />}
                        iconColor="#0891B2"
                        theme={theme}
                    />
                </View>

                {!supported && (
                    <View style={common.card}>
                        <Text style={[common.text, common.textCenter]}>{t('prayerNotifications.androidOnly')}</Text>
                    </View>
                )}

                {supported && settings && (
                    <>
                        {hasAnyNotification(settings) && !permission && (
                            <View style={[common.card, styles.warningCard]}>
                                <View style={[common.row, common.gapSm, common.mbSm]}>
                                    <BellOff size={20} color={theme.warning} />
                                    <Text style={[common.textStrong, common.flex1]}>{t('prayerNotifications.permissionCardTitle')}</Text>
                                </View>
                                <Text style={[common.smallText, common.mbMd]}>{t('prayerNotifications.permissionCardMessage')}</Text>
                                <AppButton title={t('prayerNotifications.permissionButton')} size="small" onPress={askPermission} />
                            </View>
                        )}

                        {hasAnyNotification(settings) && permission && !exactAlarms && (
                            <View style={[common.card, styles.warningCard]}>
                                <View style={[common.row, common.gapSm, common.mbSm]}>
                                    <AlarmClock size={20} color={theme.warning} />
                                    <Text style={[common.textStrong, common.flex1]}>{t('prayerNotifications.exactAlarmTitle')}</Text>
                                </View>
                                <Text style={[common.smallText, common.mbMd]}>{t('prayerNotifications.exactAlarmMessage')}</Text>
                                <AppButton title={t('prayerNotifications.exactAlarmButton')} size="small" onPress={openExactAlarmSettings} />
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>{t('prayerNotifications.alertsTitle')}</Text>
                        <Text style={styles.sectionDescription}>{t('prayerNotifications.alertsDescription')}</Text>
                        <View style={styles.card}>
                            {PRAYER_KEYS.map((key, index) => {
                                const Icon = PRAYER_ICONS[index];
                                const alert = settings.alerts[index];
                                return (
                                    <View key={key} style={[styles.prayerRow, index === PRAYER_KEYS.length - 1 && styles.prayerRowLast]}>
                                        <View style={common.row}>
                                            <View style={[styles.prayerIcon, { backgroundColor: PRAYER_COLORS[index] + '1F' }]}>
                                                <Icon size={20} color={PRAYER_COLORS[index]} />
                                            </View>
                                            <View style={common.flex1}>
                                                <Text style={common.textStrong}>
                                                    {t(`prayerTimesScreen.prayers.${key}`)}
                                                    {today && <Text style={styles.prayerTime}>  {today[key]}</Text>}
                                                </Text>
                                                <Text style={common.smallText}>{t('prayerNotifications.atTime')}</Text>
                                            </View>
                                            <ModernSwitch value={alert.atTime} onValueChange={value => updateAlert(index, { atTime: value })} theme={theme} />
                                        </View>
                                        <View style={styles.beforeRow}>
                                            <Text style={styles.beforeLabel}>{t('prayerNotifications.before')}</Text>
                                            <Pills
                                                options={ALERT_BEFORE_OPTIONS}
                                                value={alert.before}
                                                onChange={before => updateAlert(index, { before })}
                                                format={minutes => (minutes === 0 ? t('prayerNotifications.off') : String(minutes))}
                                            />
                                        </View>
                                        <TouchableOpacity style={styles.soundRow} onPress={() => setSoundPickerFor(index)}>
                                            <Music size={16} color={theme.textSecondary} />
                                            <Text style={[common.smallText, common.flex1]} numberOfLines={1}>
                                                {t('prayerNotifications.soundLabel', { sound: soundLabel(alert.sound) })}
                                            </Text>
                                            <ChevronDown size={16} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.card}>
                            <SettingItem
                                title={t('prayerNotifications.cumaTitle')}
                                description={t('prayerNotifications.cumaDescription')}
                                value={settings.cuma.enabled}
                                onValueChange={enabled => update({ ...settings, cuma: { ...settings.cuma, enabled } })}
                                icon={<Landmark size={20} color="#14B8A6" />}
                                iconColor="#14B8A6"
                                theme={theme}
                            />
                            {settings.cuma.enabled && (
                                <View style={styles.subOptions}>
                                    <Text style={styles.beforeLabel}>{t('prayerNotifications.cumaBefore')}</Text>
                                    <Pills
                                        options={CUMA_BEFORE_OPTIONS}
                                        value={settings.cuma.before}
                                        onChange={before => update({ ...settings, cuma: { ...settings.cuma, before } })}
                                        format={String}
                                    />
                                </View>
                            )}
                        </View>

                        <View style={styles.card}>
                            <SettingItem
                                title={t('prayerNotifications.kazaTitle')}
                                description={t('prayerNotifications.kazaDescription')}
                                value={settings.kaza.enabled}
                                onValueChange={enabled => update({ ...settings, kaza: { enabled } })}
                                icon={<CheckCircle2 size={20} color="#22C55E" />}
                                iconColor="#22C55E"
                                theme={theme}
                            />
                            {settings.kaza.enabled && missed.length > 0 && (
                                <View style={styles.subOptions}>
                                    <Text style={styles.beforeLabel}>{t('prayerNotifications.kazaListTitle')}</Text>
                                    <Text style={common.text}>
                                        {PRAYER_KEYS.map((key, index) => ({ key, count: missed.filter(entry => entry.index === index).length }))
                                            .filter(entry => entry.count > 0)
                                            .map(entry => `${t(`prayerNotifications.kazaLabels.${entry.key}`)} ${entry.count}`)
                                            .join(' · ')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.sectionTitle}>{t('prayerNotifications.fastingTitle')}</Text>
                        <View style={styles.card}>
                            <SettingItem
                                title={t('prayerNotifications.ramadanTitle')}
                                description={t('prayerNotifications.ramadanDescription')}
                                value={settings.fasting.ramadan}
                                onValueChange={ramadan => update({ ...settings, fasting: { ...settings.fasting, ramadan } })}
                                icon={<Moon size={20} color="#8B5CF6" />}
                                iconColor="#8B5CF6"
                                theme={theme}
                            />
                            <SettingItem
                                title={t('prayerNotifications.fastingModeTitle')}
                                description={t('prayerNotifications.fastingModeDescription')}
                                value={settings.fasting.mode}
                                onValueChange={mode => update({ ...settings, fasting: { ...settings.fasting, mode } })}
                                icon={<UtensilsCrossed size={20} color="#F97316" />}
                                iconColor="#F97316"
                                theme={theme}
                            />
                            {(settings.fasting.ramadan || settings.fasting.mode) && (
                                <View style={styles.subOptions}>
                                    <Text style={styles.beforeLabel}>{t('prayerNotifications.sahurBefore')}</Text>
                                    <Pills
                                        options={SAHUR_BEFORE_OPTIONS}
                                        value={settings.fasting.sahurBefore}
                                        onChange={sahurBefore => update({ ...settings, fasting: { ...settings.fasting, sahurBefore } })}
                                        format={minutes => (minutes === 0 ? t('prayerNotifications.off') : String(minutes))}
                                    />
                                </View>
                            )}
                        </View>

                        <Text style={styles.sectionTitle}>{t('prayerNotifications.mySoundsTitle')}</Text>
                        <Text style={styles.sectionDescription}>{t('prayerNotifications.mySoundsDescription')}</Text>
                        <View style={styles.card}>
                            {settings.sounds.map(sound => (
                                <View key={sound.name} style={styles.soundItem}>
                                    <Music size={18} color={theme.textSecondary} />
                                    <Text style={[common.text, common.flex1]} numberOfLines={1}>{sound.label}</Text>
                                    <TouchableOpacity
                                        style={styles.previewButton}
                                        onPress={() => togglePreview(sound.name)}
                                        accessibilityLabel={t(playing === sound.name ? 'prayerNotifications.stopSound' : 'prayerNotifications.playSound')}
                                    >
                                        {playing === sound.name
                                            ? <Square size={14} color={theme.primary} fill={theme.primary} />
                                            : <Play size={16} color={theme.primary} fill={theme.primary} />}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeSound(sound.name)} accessibilityLabel={t('prayerNotifications.deleteSound')}>
                                        <Trash2 size={18} color={theme.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.soundItem} onPress={addSound}>
                                <Plus size={18} color={theme.primary} />
                                <Text style={[common.textAccent, common.flex1]}>{t('prayerNotifications.addSound')}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>{t('prayerNotifications.ongoingSectionTitle')}</Text>
                        <View style={styles.card}>
                            <SettingItem
                                title={t('prayerNotifications.ongoingTitle')}
                                description={t('prayerNotifications.ongoingDescription')}
                                value={settings.ongoing}
                                onValueChange={value => update({ ...settings, ongoing: value })}
                                icon={<BellRing size={20} color={theme.primary} />}
                                iconColor={theme.primary}
                                theme={theme}
                            />
                            {settings.ongoing && (
                                <SettingItem
                                    title={t('prayerNotifications.collapsedTimesTitle')}
                                    description={t('prayerNotifications.collapsedTimesDescription')}
                                    value={settings.collapsedTimes}
                                    onValueChange={value => update({ ...settings, collapsedTimes: value })}
                                    icon={<CalendarClock size={20} color={theme.primary} />}
                                    iconColor={theme.primary}
                                    theme={theme}
                                />
                            )}
                        </View>

                        <Text style={[common.footerText, common.mtSm]}>
                            {t('prayerNotifications.locationNote', { location: formatLocationName(location) })}
                        </Text>
                    </>
                )}
            </ScrollView>

            {settings && soundPickerFor !== null && (
                <CityPickerModal
                    visible
                    title={t('prayerNotifications.pickSoundTitle', { label: t(`prayerTimesScreen.prayers.${PRAYER_KEYS[soundPickerFor]}`) })}
                    cities={[...BUILT_IN_SOUNDS, ...settings.sounds.map(sound => sound.name)].map(sound => ({ code: sound, name: soundLabel(sound) }))}
                    onSelect={option => {
                        updateAlert(soundPickerFor, { sound: option.code });
                        setSoundPickerFor(null);
                    }}
                    onClose={() => setSoundPickerFor(null)}
                />
            )}
        </View>
    );
};
