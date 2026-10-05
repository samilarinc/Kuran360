import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocateFixed, MapPin, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { LoadingView } from '@/components/LoadingView';
import { ProgressBar } from '@/components/ProgressBar';
import { SearchInput } from '@/components/SearchInput';
import { PRAYER_COLORS, PRAYER_ICONS } from '@/constants/prayerIcons';
import { PrayerTime } from '@/types';
import {
    PRAYER_KEYS,
    PRAYER_LOCATIONS,
    PrayerLocation,
    PrayerStatus,
    detectPrayerLocation,
    fetchPrayerTimes,
    findPrayerLocation,
    formatCountdown,
    formatLocationName,
    formatPrayerDate,
    getPrayerStatus,
    isPrayerNotificationSupported,
} from '@/services/prayerTimes';
import { createStyles } from './PrayerTimesScreen.styles';


/** "05:09", comparable as a string with the data's times */
const toHHMM = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** Ticks every second on its own so the rest of the screen doesn't re-render with it. */
const Countdown: React.FC<{ status: PrayerStatus }> = ({ status }) => {
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const start = status.currentAt.getTime();
    const end = status.nextAt.getTime();
    const progress = ((now - start) / (end - start)) * 100;
    const currentKey = PRAYER_KEYS[status.currentIndex];
    const nextKey = PRAYER_KEYS[status.nextIndex];

    return (
        <View style={styles.countdownBlock}>
            <Text style={styles.countdownLabel}>
                {t('prayerTimesScreen.timeRemaining', { label: t(`prayerTimesScreen.prayers.${nextKey}`) })}
            </Text>
            <Text style={styles.countdown}>{formatCountdown(end - now)}</Text>
            <ProgressBar progress={progress} height={6} trackColor="rgba(255,255,255,0.25)" fillColor="#FFF" style={styles.heroProgress} />
            <View style={styles.heroProgressLabels}>
                <Text style={styles.heroProgressText}>{t(`prayerTimesScreen.prayers.${currentKey}`)} {toHHMM(status.currentAt)}</Text>
                <Text style={styles.heroProgressText}>{t(`prayerTimesScreen.prayers.${nextKey}`)} {toHHMM(status.nextAt)}</Text>
            </View>
        </View>
    );
};

export const PrayerTimesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { settings, updateSettings } = useSettings();
    const [times, setTimes] = useState<PrayerTime[] | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [now, setNow] = useState(new Date());
    const [locating, setLocating] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const location = findPrayerLocation(settings.prayerLocation?.id);

    const loadTimes = useCallback(async () => {
        setLoadFailed(false);
        try {
            setTimes(await fetchPrayerTimes(location));
        } catch (error) {
            console.error('Error loading prayer times:', error);
            setLoadFailed(true);
        }
    }, [location]);

    useEffect(() => {
        loadTimes();
    }, [loadTimes]);

    // The current/next prayer only changes at prayer times; the countdown ticks on its own
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 15000);
        return () => clearInterval(timer);
    }, []);

    const status = useMemo(() => (times ? getPrayerStatus(times, now) : null), [times, now]);

    const selectLocation = (selected: PrayerLocation) => {
        updateSettings({
            prayerLocation: { id: selected.id, cityName: selected.cityName, districtName: selected.districtName || null },
        });
        setShowLocationPicker(false);
        setSearchQuery('');
    };

    const showLocationNotFound = () =>
        Alert.alert(t('prayerTimesScreen.locationNotFoundTitle'), t('prayerTimesScreen.locationNotFoundMessage'));

    const showPermissionDenied = () =>
        Alert.alert(t('prayerTimesScreen.permissionDeniedTitle'), t('prayerTimesScreen.permissionDeniedMessage'));

    /** Detects the location and switches to it */
    const locate = async () => {
        setLocating(true);
        try {
            const result = await detectPrayerLocation();
            if (result.status === 'denied') showPermissionDenied();
            else if (result.status === 'notFound') showLocationNotFound();
            else selectLocation(result.location);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(t('prayerTimesScreen.errorTitle'), t('prayerTimesScreen.locationErrorMessage'));
        } finally {
            setLocating(false);
        }
    };

    const filteredLocations = useMemo(() => {
        if (!searchQuery) return PRAYER_LOCATIONS.slice(0, 50);
        const query = searchQuery.toLocaleLowerCase('tr');
        return PRAYER_LOCATIONS.filter(l =>
            l.cityName.toLocaleLowerCase('tr').includes(query) ||
            (l.districtName && l.districtName.toLocaleLowerCase('tr').includes(query))
        ).slice(0, 50);
    }, [searchQuery]);

    if (!times && !loadFailed) {
        return <LoadingView />;
    }

    const today = status?.today;

    return (
        <View style={common.container}>
            <AppHeader
                title={t('screenTitles.prayerTimes')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView contentContainerStyle={[common.pMd, common.pbXl]}>
                <View style={styles.hero}>
                    <View style={styles.heroTopRow}>
                        <TouchableOpacity
                            style={styles.locationButton}
                            onPress={() => setShowLocationPicker(true)}
                            accessibilityLabel={t('prayerTimesScreen.changeLocation')}
                        >
                            <MapPin size={18} color="#FFF" />
                            <Text style={styles.locationName} numberOfLines={1}>
                                {formatLocationName(location)}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                        <View style={common.rowGap}>
                            <AppButton
                                onPress={locate}
                                variant="translucent"
                                shape="circle"
                                size="small"
                                disabled={locating}
                                icon={locating ? <ActivityIndicator size="small" color="#FFF" /> : <LocateFixed size={20} color="#FFF" />}
                            />
                            {/* Prayer time notifications are Android only (modules/prayer-notification) */}
                            {isPrayerNotificationSupported() && (
                                <AppButton
                                    onPress={() => navigation.navigate('PrayerNotificationSettings')}
                                    variant="translucent"
                                    shape="circle"
                                    size="small"
                                    icon={<Settings size={20} color="#FFF" />}
                                />
                            )}
                        </View>
                    </View>
                    <Text style={styles.dateText}>{formatPrayerDate(now, i18n.language)}</Text>
                    {today && <Text style={styles.hicriText}>{today.hicri}</Text>}

                    {status && <Countdown status={status} />}
                </View>

                {loadFailed && !times && (
                    <View style={[common.card, common.center]}>
                        <Text style={[common.text, common.textCenter, common.mbMd]}>{t('prayerTimesScreen.loadErrorMessage')}</Text>
                        <AppButton title={t('prayerTimesScreen.retry')} onPress={loadTimes} />
                    </View>
                )}

                {today && status && (
                    <View style={styles.timesCard}>
                        {PRAYER_KEYS.map((key, index) => {
                            const Icon = PRAYER_ICONS[index];
                            const isCurrent = index === status.currentIndex;
                            const isPast = !isCurrent && today[key] <= toHHMM(now);
                            const isNext = index === status.nextIndex && !isPast;
                            return (
                                <View
                                    key={key}
                                    style={[styles.timeRow, index === PRAYER_KEYS.length - 1 && styles.timeRowLast, isCurrent && styles.currentTimeRow, isPast && common.disabled]}
                                >
                                    <View style={[styles.timeIcon, { backgroundColor: PRAYER_COLORS[index] + '1F' }]}>
                                        <Icon size={20} color={PRAYER_COLORS[index]} />
                                    </View>
                                    <Text style={[styles.timeLabel, isCurrent && styles.currentText]}>
                                        {t(`prayerTimesScreen.prayers.${key}`)}
                                    </Text>
                                    {isCurrent && (
                                        <View style={[common.badge, styles.nowBadge]}>
                                            <Text style={[common.badgeText, styles.nowBadgeText]}>{t('prayerTimesScreen.now')}</Text>
                                        </View>
                                    )}
                                    <Text style={[styles.timeValue, (isCurrent || isNext) && styles.currentText]}>{today[key]}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

            </ScrollView>

            {showLocationPicker && (
                <View style={common.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[common.rowBetween, common.mbMd]}>
                            <Text style={[common.modalTitle, common.mb0]}>{t('prayerTimesScreen.selectLocation')}</Text>
                            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <SearchInput
                            style={[styles.searchContainer, { backgroundColor: theme.background }]}
                            icon
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder={t('prayerTimesScreen.searchPlaceholder')}
                        />
                        <ScrollView style={common.flex1}>
                            {filteredLocations.map((loc) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={styles.locationItem}
                                    onPress={() => selectLocation(loc)}
                                >
                                    <Text style={[common.text, loc.id === location.id && styles.currentText]}>
                                        {loc.cityName}{loc.districtName ? ` - ${loc.districtName}` : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}
        </View>
    );
};
