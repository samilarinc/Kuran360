import { requireOptionalNativeModule } from 'expo';

/** The prayer time notifications (alerts and the ongoing one) and the times they need; serialized to JSON for PrayerNotifier.kt. */
export interface PrayerNotificationConfig {
    location: string;
    /** Names of the six prayer times, imsak first */
    labels: string[];
    /** Title above the countdown, `%s` is replaced with the next prayer's name (e.g. "%s vaktine") */
    untilFormat: string;
    /** Whether the ongoing notification is on */
    ongoing: boolean;
    /** Whether the collapsed ongoing notification lists the times too, not only the countdown */
    collapsedTimes: boolean;
    /**
     * Per prayer, imsak first: alert when its time begins, and/or `before` minutes earlier (0 = no),
     * with `sound`: 'default', 'vibrate', 'silent' or a file name from importSound. Cuma, sahur and
     * iftar alerts use öğle's, imsak's and akşam's sound.
     */
    alerts: { atTime: boolean; before: number; sound: string }[];
    /** Fridays: remind `before` minutes before öğle */
    cuma: { enabled: boolean; before: number };
    /** Kaza tracking: "Kıldım" / "Kılmadım" buttons, and a reminder the next day for prayers answered "Kılmadım" */
    kaza: { enabled: boolean };
    /** Sahur (`sahurBefore` minutes before imsak, 0 = off) and iftar alerts: in Ramadan (`ramadan`) or every day (`mode`) */
    fasting: { ramadan: boolean; mode: boolean; sahurBefore: number; iftar: boolean };
    /** Minutes of the kerahat windows */
    kerahat: { afterSunrise: number; beforeOgle: number; beforeAksam: number };
    /** Translated texts; `%1` is replaced with a prayer's name, `%2` with minutes */
    texts: {
        alertAt: string;
        alertBefore: string;
        cuma: string;
        kaza: string;
        sahur: string;
        iftar: string;
        prayed: string;
        notPrayed: string;
        madeUp: string;
        kerahat: string;
        /** Prayer names in kaza texts ("Sabah" instead of "İmsak") */
        kazaLabels: string[];
    };
    /** Upcoming days; `times` are the six "HH:mm" times, `info` the date line under them */
    days: { date: string; times: string[]; info: string; ramadan: boolean }[];
}

interface PrayerNotificationModule {
    start(configJson: string): Promise<void>;
    stop(): Promise<void>;
    /** Stores the times for the home screen widgets (they show them whether or not notifications are on) and updates them */
    setWidgetData(json: string): Promise<void>;
    /** Stores the verses for the verse widgets (a PrayerWidgetVerses) and updates them */
    setWidgetVerses(json: string): Promise<void>;
    /** Whether the ongoing notification is on */
    isActive(): boolean;
    /** Copies a picked audio file into the sound library; returns the name to use as a prayer's `sound` */
    importSound(uri: string, extension: string): Promise<string>;
    deleteSound(name: string): void;
    /** The kaza list: prayers answered "Kılmadım" and not made up, as "yyyy-MM-dd:index" */
    getMissedPrayers(): string[];
    makeUpPrayer(date: string, index: number): void;
    canScheduleExactAlarms(): boolean;
    openExactAlarmSettings(): void;
}

/** What the home screen widgets need: the times part of PrayerNotificationConfig. */
export type PrayerWidgetData = Pick<PrayerNotificationConfig, 'location' | 'labels' | 'untilFormat' | 'days'>;

/** What the verse widgets show: a pool they go through (a new verse each prayer time or tap), or one fixed verse. */
export interface PrayerWidgetVerses {
    mode: 'prayer' | 'tap' | 'fixed';
    /** A new pool id starts the widgets from the pool's first verse */
    poolId: string;
    /** "Tap for a new verse", shown in 'tap' mode */
    hint: string;
    verses: { surah: number; verse: number; ref: string; arabic: string; meal: string }[];
}

/** Android only; null elsewhere. */
export const PrayerNotification = requireOptionalNativeModule<PrayerNotificationModule>('PrayerNotification');
