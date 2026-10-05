import { PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TFunction } from 'i18next';
import { PrayerTime } from '@/types';
import locations from '@/data/locations.json';
import { getDistanceKm } from '@/utils/qibla';
import { PrayerNotification, PrayerNotificationConfig } from '../../modules/prayer-notification';

/** Prayer times data: one JSON file per location (Diyanet times), downloaded from kuran360.com and cached. */

export interface PrayerLocation {
    id: string;
    cityName: string;
    districtName: string | null;
    fileName: string;
}

export const PRAYER_LOCATIONS = locations as PrayerLocation[];
export const DEFAULT_PRAYER_LOCATION_ID = '9541'; // İstanbul

export const PRAYER_KEYS = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
export type PrayerKey = typeof PRAYER_KEYS[number];

const CACHE_PREFIX = 'prayerTimes.file.';
const TRAVEL_MODE_KEY = 'prayerTimes.travelMode';
const TRAVEL_LAST_CHECK_KEY = 'prayerTimes.travelLastCheck';
const NOTIFICATION_SETTINGS_KEY = 'prayerTimes.notificationSettings';

/** Travel mode looks at the location at most this often... */
export const TRAVEL_CHECK_INTERVAL_MS = 60 * 60 * 1000;
/** ...and only looks the place up again after moving this far, so the geocoder is rarely called. */
const TRAVEL_MIN_DISTANCE_KM = 10;

/** The saved location, or İstanbul when none is saved (or it is no longer in the list). */
export const findPrayerLocation = (id?: string): PrayerLocation =>
    PRAYER_LOCATIONS.find(l => l.id === id) ?? PRAYER_LOCATIONS.find(l => l.id === DEFAULT_PRAYER_LOCATION_ID)!;

const memoryCache = new Map<string, PrayerTime[]>();

/** The location's times for the year; falls back to the last downloaded copy when offline. */
export const fetchPrayerTimes = async (location: PrayerLocation): Promise<PrayerTime[]> => {
    const cached = memoryCache.get(location.fileName);
    if (cached) return cached;
    const cacheKey = CACHE_PREFIX + location.fileName;
    try {
        const baseUrl = Platform.OS === 'web' ? '' : 'https://kuran360.com';
        const response = await fetch(`${baseUrl}/2025_ezan/${location.fileName}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: PrayerTime[] = await response.json();
        memoryCache.set(location.fileName, data);
        AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => { });
        return data;
    } catch (error) {
        const stored = await AsyncStorage.getItem(cacheKey);
        if (!stored) throw error;
        const data: PrayerTime[] = JSON.parse(stored);
        memoryCache.set(location.fileName, data);
        return data;
    }
};

/** The data covers one calendar year; its year is read from the Gregorian date text ("03 Ekim 2026 Cumartesi"). */
const dataYear = (times: PrayerTime[]) => Number(times[0]?.miladi.match(/\d{4}/)?.[0]);

const dayOfYear = (date: Date) =>
    Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);

export const findPrayerDay = (times: PrayerTime[], date: Date): PrayerTime | undefined => {
    if (date.getFullYear() !== dataYear(times)) return undefined;
    const index = dayOfYear(date);
    return times.find(pt => pt.date_index === index);
};

const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

/** `hhmm` ("05:09") on the day of `date`. */
const atTime = (date: Date, hhmm: string) => {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
};

export interface PrayerStatus {
    today: PrayerTime;
    /** Index in PRAYER_KEYS of the prayer whose time it is now (yatsı until imsak) */
    currentIndex: number;
    nextIndex: number;
    currentAt: Date;
    nextAt: Date;
}

export const getPrayerStatus = (times: PrayerTime[], now = new Date()): PrayerStatus | null => {
    const today = findPrayerDay(times, now);
    if (!today) return null;
    const todayTimes = PRAYER_KEYS.map(key => atTime(now, today[key]));
    const next = todayTimes.findIndex(time => time > now);

    if (next > 0) {
        return { today, currentIndex: next - 1, nextIndex: next, currentAt: todayTimes[next - 1], nextAt: todayTimes[next] };
    }
    if (next === 0) {
        // Before imsak: still the previous night's yatsı
        const yesterday = addDays(now, -1);
        const yatsi = (findPrayerDay(times, yesterday) ?? today).yatsi;
        return { today, currentIndex: PRAYER_KEYS.length - 1, nextIndex: 0, currentAt: atTime(yesterday, yatsi), nextAt: todayTimes[0] };
    }
    // After yatsı: counting down to tomorrow's imsak
    const tomorrow = addDays(now, 1);
    const imsak = (findPrayerDay(times, tomorrow) ?? today).imsak;
    return {
        today,
        currentIndex: PRAYER_KEYS.length - 1,
        nextIndex: 0,
        currentAt: todayTimes[PRAYER_KEYS.length - 1],
        nextAt: atTime(tomorrow, imsak),
    };
};

/** "02:15:07" */
export const formatCountdown = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
};

/** The Gregorian date in the app language ("3 Ekim 2026 Cumartesi"); the data's own text is always Turkish. */
export const formatPrayerDate = (date: Date, language: string) =>
    date.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

// --- Matching a geocoded address to a location ---

const TURKISH_FOLD: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

/**
 * Compares place names regardless of Turkish letters, case and punctuation: the location list is
 * ASCII ("Istanbul", "Karadeniz-eregli") while geocoders answer "İstanbul", "Karadeniz Ereğli".
 */
const foldName = (name: string) =>
    name
        .toLocaleLowerCase('tr')
        .replace(/[çğıöşüâîû]/g, c => TURKISH_FOLD[c])
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/g, '');

/** District names repeated in other provinces carry a letter suffix in the list ("Edremit-v" is Van's). */
const districtKey = (name: string) => foldName(name.replace(/-[a-z]$/i, ''));

interface GeocodedPlace {
    countryCode?: string | null;
    /** Names that may be the province, most likely first */
    provinces: (string | null | undefined)[];
    /** Names that may be the district, most likely first */
    districts: (string | null | undefined)[];
}

/** The province from the address, then its district if it is in the list, else the province center. */
export const matchPrayerLocation = (place: GeocodedPlace): PrayerLocation | null => {
    if (place.countryCode && place.countryCode.toUpperCase() !== 'TR') return null;
    const provinceTerms = place.provinces.filter(Boolean).map(name => foldName(name!));
    const districtTerms = place.districts.filter(Boolean).map(name => foldName(name!));

    const province = provinceTerms.find(term => PRAYER_LOCATIONS.some(l => foldName(l.cityName) === term));
    if (province) {
        const inProvince = PRAYER_LOCATIONS.filter(l => foldName(l.cityName) === province);
        for (const term of districtTerms) {
            const district = inProvince.find(l => l.districtName && districtKey(l.districtName) === term);
            if (district) return district;
        }
        return inProvince.find(l => !l.districtName) ?? inProvince[0];
    }
    // Province not recognized: accept a district name only when no other province has it
    for (const term of districtTerms) {
        const matches = PRAYER_LOCATIONS.filter(l => l.districtName && districtKey(l.districtName) === term);
        if (matches.length === 1) return matches[0];
    }
    return null;
};

/** The device geocoder (Android/iOS), or OpenStreetMap Nominatim where there is none (web) or it fails. */
const reverseGeocode = async (coords: { latitude: number; longitude: number }): Promise<GeocodedPlace | null> => {
    try {
        const [address] = await Location.reverseGeocodeAsync(coords);
        if (address && (address.region || address.subregion || address.city)) {
            return {
                countryCode: address.isoCountryCode,
                provinces: [address.region, address.city, address.subregion],
                districts: [address.subregion, address.city, address.district],
            };
        }
    } catch (error) {
        console.warn('Device geocoder failed, using Nominatim:', error);
    }
    // Nominatim's usage policy asks for an identifying User-Agent (browsers send their own and a Referer instead)
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`,
        { headers: { 'Accept-Language': 'tr', ...(Platform.OS !== 'web' && { 'User-Agent': 'Kuran360/1.0 (https://kuran360.com)' }) } },
    );
    const data = await response.json();
    const a = data?.address;
    if (!a) return null;
    return {
        countryCode: a.country_code,
        provinces: [a.province, a.state, a.city],
        districts: [a.town, a.county, a.city_district, a.district, a.municipality, a.city, a.suburb, a.village],
    };
};

export type DetectResult =
    | { status: 'found'; location: PrayerLocation; coords: { latitude: number; longitude: number } }
    | { status: 'denied' }
    | { status: 'notFound' };

/** Finds the location for the device's position; asks for location permission unless `silent`. */
export const detectPrayerLocation = async (silent = false): Promise<DetectResult> => {
    const permission = silent ? await Location.getForegroundPermissionsAsync() : await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
    const position =
        (await Location.getLastKnownPositionAsync({ maxAge: TRAVEL_CHECK_INTERVAL_MS / 4 }).catch(() => null)) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    const place = await reverseGeocode(coords);
    const location = place && matchPrayerLocation(place);
    if (!location) return { status: 'notFound' };
    await AsyncStorage.setItem(TRAVEL_LAST_CHECK_KEY, JSON.stringify({ ...coords, at: Date.now(), id: location.id }));
    return { status: 'found', location, coords };
};

// --- Travel mode: follow the device's location while the app is used ---

export const isTravelModeOn = async () => (await AsyncStorage.getItem(TRAVEL_MODE_KEY)) === '1';

export const setTravelMode = (on: boolean) =>
    on ? AsyncStorage.setItem(TRAVEL_MODE_KEY, '1') : AsyncStorage.removeItem(TRAVEL_MODE_KEY);

/**
 * With travel mode on, returns the location to switch to when the device is now somewhere else
 * than `currentId`. Runs at most once an hour, never asks for permission, and only geocodes after
 * moving more than TRAVEL_MIN_DISTANCE_KM from the last place it looked up.
 */
export const checkTravelLocation = async (currentId: string | undefined): Promise<PrayerLocation | null> => {
    if (!(await isTravelModeOn())) return null;
    if (!(await Location.getForegroundPermissionsAsync()).granted) return null;
    const stored = await AsyncStorage.getItem(TRAVEL_LAST_CHECK_KEY);
    const last: { latitude: number; longitude: number; at: number; id: string } | null = stored ? JSON.parse(stored) : null;
    if (last && Date.now() - last.at < TRAVEL_CHECK_INTERVAL_MS) return null;

    const position =
        (await Location.getLastKnownPositionAsync({ maxAge: TRAVEL_CHECK_INTERVAL_MS }).catch(() => null)) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    if (last && last.id === currentId && getDistanceKm(last, coords) < TRAVEL_MIN_DISTANCE_KM) {
        await AsyncStorage.setItem(TRAVEL_LAST_CHECK_KEY, JSON.stringify({ ...last, at: Date.now() }));
        return null;
    }
    const result = await detectPrayerLocation(true);
    if (result.status !== 'found') {
        // Abroad or not in the list: keep the current location and try again next hour
        await AsyncStorage.setItem(TRAVEL_LAST_CHECK_KEY, JSON.stringify({ ...coords, at: Date.now(), id: currentId }));
        return null;
    }
    return result.location.id !== currentId ? result.location : null;
};

// --- Notifications (Android): alerts at prayer times and the ongoing countdown ---

export const isPrayerNotificationSupported = () => PrayerNotification !== null;

export interface PrayerAlertSetting {
    /** Notify when the prayer's time begins */
    atTime: boolean;
    /** Also notify this many minutes before (0 = no) */
    before: number;
    /** 'default', 'vibrate', 'silent' or the name of a sound in the library */
    sound: string;
}

export const BUILT_IN_SOUNDS = ['default', 'vibrate', 'silent'];

export interface PrayerNotificationSettings {
    /** The ongoing notification with the countdown to the next prayer */
    ongoing: boolean;
    /** Whether the collapsed ongoing notification lists the times too, not only the countdown */
    collapsedTimes: boolean;
    /** One per prayer, in PRAYER_KEYS order */
    alerts: PrayerAlertSetting[];
    /** Friday reminder before öğle (Cuma namazı) */
    cuma: { enabled: boolean; before: number };
    /** "Kıldım" / "Kılmadım" buttons; prayers answered "Kılmadım" go on the kaza list and are reminded the next day */
    kaza: { enabled: boolean };
    /** Sahur (`sahurBefore` minutes before imsak, 0 = off) and iftar alerts: automatic in Ramadan, every day in fasting mode */
    fasting: { ramadan: boolean; mode: boolean; sahurBefore: number };
    /** The user's own sounds ("Seslerim"), to choose from for each prayer; `label` is the original file name */
    sounds: { name: string; label: string }[];
}

/** Choices for the reminder before a prayer time, in minutes (0 = none) */
export const ALERT_BEFORE_OPTIONS = [0, 5, 10, 15, 30, 45, 60];
export const CUMA_BEFORE_OPTIONS = [15, 30, 45, 60, 90, 120];
export const SAHUR_BEFORE_OPTIONS = [0, 15, 30, 45, 60, 90];

/**
 * Kerahat windows in minutes, from Diyanet's fatwa on mekruh times: about 40–50 minutes after
 * sunrise, about 10 minutes before öğle (istiva) and 40–50 minutes before sunset.
 */
const KERAHAT = { afterSunrise: 45, beforeOgle: 10, beforeAksam: 45 };

const DEFAULT_NOTIFICATION_SETTINGS: PrayerNotificationSettings = {
    ongoing: false,
    collapsedTimes: false,
    alerts: PRAYER_KEYS.map(() => ({ atTime: false, before: 0, sound: 'default' })),
    cuma: { enabled: true, before: 60 },
    kaza: { enabled: false },
    fasting: { ramadan: true, mode: false, sahurBefore: 45 },
    sounds: [],
};

/** Kept on the device, not in the synced settings: notifications belong to the phone they ring on. */
export const getNotificationSettings = async (): Promise<PrayerNotificationSettings> => {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!stored) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<PrayerNotificationSettings>;
    const defaults = DEFAULT_NOTIFICATION_SETTINGS;
    return {
        ...defaults,
        ...parsed,
        alerts: PRAYER_KEYS.map((_, i) => ({ ...defaults.alerts[i], ...parsed.alerts?.[i] })),
        cuma: { ...defaults.cuma, ...parsed.cuma },
        kaza: { ...defaults.kaza, ...parsed.kaza },
        fasting: { ...defaults.fasting, ...parsed.fasting },
    };
};

export const saveNotificationSettings = (settings: PrayerNotificationSettings) =>
    AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));

export const hasAnyNotification = (settings: PrayerNotificationSettings) =>
    settings.ongoing ||
    settings.alerts.some(alert => alert.atTime || alert.before > 0) ||
    settings.cuma.enabled ||
    settings.kaza.enabled ||
    settings.fasting.ramadan ||
    settings.fasting.mode;

export const formatLocationName = (location: { cityName: string; districtName?: string | null }) =>
    location.districtName ? `${location.cityName}, ${location.districtName}` : location.cityName;

const isoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const buildNotificationConfig = (
    location: PrayerLocation,
    times: PrayerTime[],
    t: TFunction,
    language: string,
    settings: PrayerNotificationSettings,
): PrayerNotificationConfig => {
    const year = dataYear(times);
    const todayIndex = dayOfYear(new Date());
    const days = times
        .filter(day => new Date().getFullYear() < year || day.date_index >= todayIndex - 1)
        .map(day => {
            const date = new Date(year, 0, day.date_index);
            return {
                date: isoDate(date),
                times: PRAYER_KEYS.map(key => day[key]),
                info: `${formatPrayerDate(date, language)} · ${day.hicri}`,
                // The Hijri date text is always Turkish ("12 Ramazan 1448")
                ramadan: day.hicri.includes('Ramazan'),
            };
        });
    const label = (key: string, values?: Record<string, string>) => t(`prayerNotifications.texts.${key}`, values);
    return {
        location: formatLocationName(location),
        labels: PRAYER_KEYS.map(key => t(`prayerTimesScreen.prayers.${key}`)),
        untilFormat: t('prayerNotifications.ongoingUntil', { label: '%s' }),
        ongoing: settings.ongoing,
        collapsedTimes: settings.collapsedTimes,
        // A sound removed from the library falls back to the default
        alerts: settings.alerts.map(alert => ({
            ...alert,
            sound: BUILT_IN_SOUNDS.includes(alert.sound) || settings.sounds.some(sound => sound.name === alert.sound) ? alert.sound : 'default',
        })),
        cuma: settings.cuma,
        kaza: settings.kaza,
        // Fasting always comes with the iftar alert
        fasting: { ...settings.fasting, iftar: true },
        kerahat: KERAHAT,
        texts: {
            alertAt: label('alertAt', { label: '%1' }),
            alertBefore: label('alertBefore', { label: '%1', minutes: '%2' }),
            cuma: label('cuma', { minutes: '%2' }),
            kaza: label('kaza', { label: '%1' }),
            sahur: label('sahur', { minutes: '%2' }),
            iftar: label('iftar'),
            prayed: label('prayed'),
            notPrayed: label('notPrayed'),
            madeUp: label('madeUp'),
            kerahat: label('kerahat'),
            kazaLabels: PRAYER_KEYS.map(key => t(`prayerNotifications.kazaLabels.${key}`)),
        },
        days,
    };
};

/** Applies the saved notification settings for `location`: schedules and shows what is on, removes what is off. */
export const syncPrayerNotifications = async (location: PrayerLocation, t: TFunction, language: string) => {
    if (!PrayerNotification) return;
    const settings = await getNotificationSettings();
    if (!hasAnyNotification(settings)) {
        await PrayerNotification.stop();
        return;
    }
    const times = await fetchPrayerTimes(location);
    await PrayerNotification.start(JSON.stringify(buildNotificationConfig(location, times, t, language, settings)));
};

/** Android 13+ asks before an app may post notifications. */
export const requestNotificationPermission = async () => {
    if (Platform.OS !== 'android' || Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
};

/** Lets the user pick an audio file and adds it to the sound library; null when cancelled. */
export const importAlertSound = async (): Promise<{ name: string; label: string } | null> => {
    if (!PrayerNotification) return null;
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: false });
    const file = result.assets?.[0];
    if (result.canceled || !file) return null;
    const extension = file.name.includes('.') ? file.name.split('.').pop()! : 'mp3';
    const name = await PrayerNotification.importSound(file.uri, extension);
    return { name, label: file.name };
};

/** Local file of a sound in the library (importSound copies them to filesDir/prayer_sounds), for playing a preview */
export const alertSoundUri = (name: string) => `${FileSystem.documentDirectory}prayer_sounds/${name}`;

export const deleteAlertSound = (name: string) => PrayerNotification?.deleteSound(name);

/** The kaza list, as { date: "yyyy-MM-dd", index } in PRAYER_KEYS order */
export const getMissedPrayers = () =>
    (PrayerNotification?.getMissedPrayers() ?? []).map(entry => {
        const [date, index] = entry.split(':');
        return { date, index: Number(index) };
    });

export const hasNotificationPermission = async () =>
    Platform.OS !== 'android' || Platform.Version < 33 || PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

export const canScheduleExactAlarms = () => PrayerNotification?.canScheduleExactAlarms() ?? true;

export const openExactAlarmSettings = () => PrayerNotification?.openExactAlarmSettings();
