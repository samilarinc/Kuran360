import { SpecialDayCategory, SpecialDayDef, specialDaysBetween } from '@/utils/hijriCalendar';

/** Reminders for the kandil nights and other blessed days of the Hijri calendar (see SPECIAL_DAYS). */
export interface SpecialDayReminderSettings {
    enabled: boolean;
    /** Per category of day; a category that is off gets no reminders */
    categories: Record<SpecialDayCategory, boolean>;
    /** Also remind this many days ahead (0 = only on the day itself) */
    leadDays: number;
}

export const SPECIAL_DAY_LEAD_OPTIONS = [0, 1, 2, 3];

/** The reminder on the day itself: for a night, at maghrib when it begins; otherwise in the morning. */
const DAY_REMINDER_TIME = '07:00';
/** Used when the maghrib time of the day isn't known */
const MAGHRIB_FALLBACK_TIME = '19:00';
/** The reminder `leadDays` ahead, in the evening so it is seen when people are free */
const EARLY_REMINDER_TIME = '20:00';

export interface PlannedReminder {
    at: Date;
    def: SpecialDayDef;
    /** 0 = the reminder on the day (or at the start of the night) itself, otherwise how many days ahead it is sent */
    daysBefore: number;
    /** The Gregorian day the calendar marks (for a night, the day after the evening it starts) */
    date: Date;
}

const withTime = (day: Date, hhmm: string) => {
    const [hours, minutes] = hhmm.split(':').map(Number);
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0);
};

/**
 * Reminders due after `now` for the special days of the next `windowDays`, soonest first.
 * `maghrib(day)` is the "HH:mm" akşam time of a Gregorian day (undefined when unknown).
 * Nights start at the maghrib before the marked day, so their reminder is at maghrib of `startDate`.
 */
export function planSpecialDayReminders(
    now: Date,
    settings: SpecialDayReminderSettings,
    maghrib: (day: Date) => string | undefined,
    windowDays = 365,
): PlannedReminder[] {
    if (!settings.enabled) return [];
    const until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + windowDays);
    const result: PlannedReminder[] = [];
    for (const { def, date, startDate } of specialDaysBetween(now, until)) {
        if (!def.category || !settings.categories[def.category]) continue;
        const onTheDay = def.night ? withTime(startDate, maghrib(startDate) ?? MAGHRIB_FALLBACK_TIME) : withTime(startDate, DAY_REMINDER_TIME);
        result.push({ at: onTheDay, def, daysBefore: 0, date });
        if (settings.leadDays > 0) {
            const early = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - settings.leadDays);
            result.push({ at: withTime(early, EARLY_REMINDER_TIME), def, daysBefore: settings.leadDays, date });
        }
    }
    return result.filter(reminder => reminder.at > now).sort((a, b) => a.at.getTime() - b.at.getTime());
}
