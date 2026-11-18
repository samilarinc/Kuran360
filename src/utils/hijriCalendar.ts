// ── Calendar math ─────────────────────────────────────────────────────────────

export function mod(a: number, b: number) { return a - b * Math.floor(a / b); }
export function leapG(y: number) { return y % 4 === 0 && !((y % 100 === 0) && y % 400 !== 0); }
export function g2jd(y: number, m: number, d: number) {
    return 1721424.5 + 365 * (y - 1) + Math.floor((y - 1) / 4) - Math.floor((y - 1) / 100)
        + Math.floor((y - 1) / 400) + Math.floor((367 * m - 362) / 12 + (m <= 2 ? 0 : leapG(y) ? -1 : -2) + d);
}
export function jd2g(jd: number): [number, number, number] {
    const w = Math.floor(jd - 0.5) + 0.5, dep = w - 1721425.5;
    const qc = Math.floor(dep / 146097), dqc = mod(dep, 146097);
    const c = Math.floor(dqc / 36524), dc = mod(dqc, 36524);
    const q = Math.floor(dc / 1461), dq = mod(dc, 1461);
    const yi = Math.floor(dq / 365);
    let y = qc * 400 + c * 100 + q * 4 + yi;
    if (!(c === 4 || yi === 4)) y++;
    const yd = w - g2jd(y, 1, 1);
    const la = w < g2jd(y, 3, 1) ? 0 : leapG(y) ? 1 : 2;
    const m = Math.floor(((yd + la) * 12 + 373) / 367);
    return [y, m, (w - g2jd(y, m, 1)) + 1];
}
/** The tabular (arithmetic) Islamic calendar; only a fallback, it can be days off from Diyanet's */
function tabularH2jd(y: number, m: number, d: number) {
    return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948438.5;
}
function tabularJd2h(jd: number): [number, number] {
    jd = Math.floor(jd) + 0.5;
    const y = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631);
    const m = Math.min(12, Math.ceil((jd - (29 + tabularH2jd(y, 1, 1))) / 29.5) + 1);
    return [y, m];
}

// ── Diyanet month starts ──────────────────────────────────────────────────────

/**
 * Diyanet sets each month's first day by its own calculation, which the tabular calendar can miss
 * by a day or two. Known first days, key `<Hijri year>-<month>`, value the Gregorian day ("yyyy-mm-dd").
 * Bundled from Diyanet's prayer time data (2026) and its 2027 dini günler takvimi; more are learned
 * at runtime from the prayer time data (learnMonthStarts), so each new year fills itself in.
 */
const monthStarts: Record<string, number> = {};

const BUNDLED_MONTH_STARTS: Record<string, string> = {
    '1447-8': '2026-01-20', '1447-9': '2026-02-19', '1447-10': '2026-03-20', '1447-11': '2026-04-18',
    '1447-12': '2026-05-18', '1448-1': '2026-06-16', '1448-2': '2026-07-15', '1448-3': '2026-08-14',
    '1448-4': '2026-09-12', '1448-5': '2026-10-12', '1448-6': '2026-11-10', '1448-7': '2026-12-10',
    // From the 2027 calendar: Berat 15 Şaban = 23 Jan, Bayram 1 Şevval = 9 Mar, Kurban 10 Zilhicce = 16 May, Mevlid 12 Rebiülevvel = 14 Aug
    '1448-8': '2027-01-09', '1448-10': '2027-03-09', '1448-12': '2027-05-07', '1449-3': '2027-08-03',
};

const monthIndex = (y: number, m: number) => y * 12 + (m - 1);

const setMonthStart = (y: number, m: number, gy: number, gm: number, gd: number) => {
    monthStarts[`${y}-${m}`] = g2jd(gy, gm, gd);
};

for (const [key, date] of Object.entries(BUNDLED_MONTH_STARTS)) {
    const [y, m] = key.split('-').map(Number);
    const [gy, gm, gd] = date.split('-').map(Number);
    setMonthStart(y, m, gy, gm, gd);
}

/** Turkish month names as Diyanet writes them in the prayer time data, folded to ASCII lowercase */
const DIYANET_MONTH_NAMES = [
    'muharrem', 'safer', 'rebiulevvel', 'rebiulahir', 'cemaziyelevvel', 'cemaziyelahir',
    'recep', 'saban', 'ramazan', 'sevval', 'zilkade', 'zilhicce',
];
const foldTurkish = (s: string) => s.toLocaleLowerCase('tr-TR')
    .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u');

/**
 * Learns Diyanet's month starts from prayer time days: a day whose Hijri text is "1 <month> <year>"
 * starts that month on its Gregorian date. Returns whether anything new was learned.
 */
export function learnMonthStarts(days: { date: Date; hicri: string }[]) {
    let learned = false;
    for (const { date, hicri } of days) {
        const match = hicri.trim().match(/^0?1\s+(.+?)\s+(\d{4})$/);
        if (!match) continue;
        const m = DIYANET_MONTH_NAMES.indexOf(foldTurkish(match[1]).replace(/\s+/g, '')) + 1;
        if (!m) continue;
        const y = Number(match[2]);
        const jd = g2jd(date.getFullYear(), date.getMonth() + 1, date.getDate());
        if (monthStarts[`${y}-${m}`] !== jd) {
            monthStarts[`${y}-${m}`] = jd;
            learned = true;
        }
    }
    return learned;
}

/**
 * Julian day of a Hijri month's first day: Diyanet's when known, otherwise the tabular date
 * shifted by how far the tabular calendar was off at the nearest month that is known.
 */
function monthStartJD(y: number, m: number) {
    const known = monthStarts[`${y}-${m}`];
    if (known !== undefined) return known;
    const target = monthIndex(y, m);
    let nearest: { distance: number; shift: number } | undefined;
    for (const [key, jd] of Object.entries(monthStarts)) {
        const [ky, km] = key.split('-').map(Number);
        const distance = Math.abs(monthIndex(ky, km) - target);
        if (!nearest || distance < nearest.distance) nearest = { distance, shift: jd - tabularH2jd(ky, km, 1) };
    }
    // Far from any known month the drift is unknown, so the tabular date is used as is
    const shift = nearest && nearest.distance <= 12 ? nearest.shift : 0;
    return tabularH2jd(y, m, 1) + shift;
}

// ── Hijri ⇄ Julian day ────────────────────────────────────────────────────────

export function h2jd(y: number, m: number, d: number) {
    return monthStartJD(y, m) + d - 1;
}
export function hMonthLen(y: number, m: number) {
    const [ny, nm] = addHM(y, m, 1);
    return Math.round(monthStartJD(ny, nm) - monthStartJD(y, m));
}
export function jd2h(jd: number): [number, number, number] {
    jd = Math.floor(jd) + 0.5;
    let [y, m] = tabularJd2h(jd);
    while (jd < monthStartJD(y, m)) [y, m] = addHM(y, m, -1);
    while (jd >= monthStartJD(...addHM(y, m, 1))) [y, m] = addHM(y, m, 1);
    return [y, m, Math.round(jd - monthStartJD(y, m)) + 1];
}
export function addHM(y: number, m: number, off: number): [number, number] {
    const k = (m - 1) + off;
    return [y + Math.floor(k / 12), mod(k, 12) + 1];
}
export function moonPhase(jd: number): MoonPhaseInfo {
    const frac = mod(jd - 2451550.1, 29.530588853) / 29.530588853;
    return { illum: (1 - Math.cos(2 * Math.PI * frac)) / 2, wax: frac < 0.5 };
}

export function getTodayH() {
    const t = new Date();
    const [y, m, d] = jd2h(g2jd(t.getFullYear(), t.getMonth() + 1, t.getDate()));
    return { y, m, d };
}

// ── Names ─────────────────────────────────────────────────────────────────────

/** Arabic month names; the Turkish/English names live in the locales (hijriCalendar.months) */
export const MONTHS_AR = [
    'المُحَرَّم', 'صَفَر', 'رَبيع الأوّل', 'رَبيع الآخِر', 'جُمادى الأولى', 'جُمادى الآخِرة',
    'رَجَب', 'شَعْبان', 'رَمَضان', 'شَوّال', 'ذو القَعْدة', 'ذو الحِجّة',
];

export type MoonPhaseInfo = { illum: number; wax: boolean };

/** Locale key under hijriCalendar.phases for a moon phase */
export function phaseKey(p: MoonPhaseInfo) {
    const i = p.illum;
    if (i < 0.04) return 'new';
    if (i > 0.96) return 'full';
    if (Math.abs(i - 0.5) < 0.07) return p.wax ? 'firstQuarter' : 'lastQuarter';
    if (i < 0.5) return p.wax ? 'waxingCrescent' : 'waningCrescent';
    return p.wax ? 'waxingGibbous' : 'waningGibbous';
}

/** Local-midnight Gregorian date of a Hijri date */
export const hijriToDate = (y: number, m: number, d: number) => {
    const [gy, gm, gd] = jd2g(h2jd(y, m, d));
    return new Date(gy, gm - 1, gd);
};

// ── Special days (single source for the calendar screen and the reminders) ────

export type SpecialDayId =
    | 'hijriNewYear' | 'ashura' | 'mawlid' | 'regaib' | 'miraj' | 'berat'
    | 'ramadanStart' | 'qadr' | 'ramadanArefe' | 'fitr' | 'tarwiyah' | 'arafah' | 'adha';

/** What the reminder settings group days by; days without a category are only shown in the calendar. */
export type SpecialDayCategory = 'kandil' | 'bayram' | 'blessed';

export interface SpecialDayDef {
    id: SpecialDayId;
    ar: string;
    category?: SpecialDayCategory;
    /**
     * Islamic days begin at sunset, so a "night" (kandil, the first teravih) belongs to the evening
     * before the Gregorian day the calendar marks, the same way Diyanet lists kandils: Miraç 2027
     * is marked on 5 Jan (27 Recep) and the night starts at maghrib on 4 Jan. Other days start
     * with the Gregorian day itself.
     */
    night: boolean;
    month: number;
    /** Hijri day of the month; with `firstFriday` the first Friday on or after it (Regaib: first Friday of Recep) */
    day: number;
    firstFriday?: boolean;
    /** Days from the Hijri date (-1 = the day before; Ramazan Bayramı arefesi is the day before 1 Şevval) */
    offset?: number;
}

export const SPECIAL_DAYS: SpecialDayDef[] = [
    { id: 'hijriNewYear', ar: 'رأس السنة الهجرية', category: 'blessed', night: false, month: 1, day: 1 },
    { id: 'ashura', ar: 'يوم عاشوراء', category: 'blessed', night: false, month: 1, day: 10 },
    { id: 'mawlid', ar: 'المولد النبوي', category: 'kandil', night: true, month: 3, day: 12 },
    { id: 'regaib', ar: 'ليلة الرغائب', category: 'kandil', night: true, month: 7, day: 1, firstFriday: true },
    { id: 'miraj', ar: 'الإسراء والمعراج', category: 'kandil', night: true, month: 7, day: 27 },
    { id: 'berat', ar: 'ليلة البَراءة', category: 'kandil', night: true, month: 8, day: 15 },
    { id: 'ramadanStart', ar: 'أوّل رمضان', category: 'blessed', night: true, month: 9, day: 1 },
    { id: 'qadr', ar: 'ليلة القَدْر', category: 'kandil', night: true, month: 9, day: 27 },
    { id: 'ramadanArefe', ar: 'وقفة عيد الفِطر', category: 'bayram', night: false, month: 10, day: 1, offset: -1 },
    { id: 'fitr', ar: 'عيد الفِطر', category: 'bayram', night: false, month: 10, day: 1 },
    { id: 'tarwiyah', ar: 'يوم التَّروية', night: false, month: 12, day: 8 },
    { id: 'arafah', ar: 'يوم عَرَفة', category: 'bayram', night: false, month: 12, day: 9 },
    { id: 'adha', ar: 'عيد الأضحى', category: 'bayram', night: false, month: 12, day: 10 },
];

export interface SpecialDayOccurrence {
    def: SpecialDayDef;
    hijriYear: number;
    /** The Gregorian day the calendar marks (local midnight) */
    date: Date;
    /** Gregorian day it starts on: the evening before `date` for nights, `date` itself otherwise */
    startDate: Date;
}

const localDate = ([y, m, d]: [number, number, number]) => new Date(y, m - 1, d);

const shiftDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Julian day number of a special day in a Hijri year */
const specialDayJD = (def: SpecialDayDef, hy: number) => {
    let jd = h2jd(hy, def.month, def.day);
    if (def.firstFriday) {
        while (localDate(jd2g(jd)).getDay() !== 5) jd += 1;
    }
    return jd + (def.offset ?? 0);
};

/** The special day marked on a Hijri date, for the calendar screen */
export function getSpecialDay(hy: number, hm: number, hd: number): SpecialDayDef | undefined {
    const jd = h2jd(hy, hm, hd);
    return SPECIAL_DAYS.find(def => specialDayJD(def, hy) === jd);
}

export interface SpecialDayInYear {
    def: SpecialDayDef;
    /** Hijri date the calendar marks */
    month: number;
    day: number;
    /** The Gregorian day the calendar marks (local midnight) */
    date: Date;
}

/** All special days of a Hijri year, in date order (for the list on the calendar screen) */
export function specialDaysOfYear(hy: number): SpecialDayInYear[] {
    return SPECIAL_DAYS.map(def => {
        const jd = specialDayJD(def, hy);
        const [, month, day] = jd2h(jd);
        return { def, month, day, date: localDate(jd2g(jd)) };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Every special day whose marked Gregorian day is in [from, to] (dates only, time ignored), in date order. */
export function specialDaysBetween(from: Date, to: Date): SpecialDayOccurrence[] {
    const first = localDate(jd2g(g2jd(from.getFullYear(), from.getMonth() + 1, from.getDate())));
    const last = localDate(jd2g(g2jd(to.getFullYear(), to.getMonth() + 1, to.getDate())));
    const [fromYear] = jd2h(g2jd(first.getFullYear(), first.getMonth() + 1, first.getDate()));
    const [toYear] = jd2h(g2jd(last.getFullYear(), last.getMonth() + 1, last.getDate()));
    const result: SpecialDayOccurrence[] = [];
    for (let hy = fromYear; hy <= toYear; hy++) {
        for (const def of SPECIAL_DAYS) {
            const date = localDate(jd2g(specialDayJD(def, hy)));
            if (date < first || date > last) continue;
            result.push({ def, hijriYear: hy, date, startDate: def.night ? shiftDays(date, -1) : date });
        }
    }
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export type HijriNoteEntry = { id: string; text: string; ts: number };
