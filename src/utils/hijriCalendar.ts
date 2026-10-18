import { Platform } from 'react-native';

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
export function h2jd(y: number, m: number, d: number) {
    return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948438.5;
}
export function jd2h(jd: number): [number, number, number] {
    jd = Math.floor(jd) + 0.5;
    const y = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631);
    const m = Math.min(12, Math.ceil((jd - (29 + h2jd(y, 1, 1))) / 29.5) + 1);
    return [y, m, Math.round(jd - h2jd(y, m, 1)) + 1];
}
export function hMonthLen(y: number, m: number) {
    return Math.round((m === 12 ? h2jd(y + 1, 1, 1) : h2jd(y, m + 1, 1)) - h2jd(y, m, 1));
}
export function addHM(y: number, m: number, off: number): [number, number] {
    const k = (m - 1) + off;
    return [y + Math.floor(k / 12), mod(k, 12) + 1];
}
export function toAr(n: number) { return String(Math.round(n)).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]); }
export function moonPhase(jd: number) {
    const frac = mod(jd - 2451550.1, 29.530588853) / 29.530588853;
    return { illum: (1 - Math.cos(2 * Math.PI * frac)) / 2, wax: frac < 0.5 };
}
export function phaseLabel(p: { illum: number; wax: boolean }) {
    const i = p.illum;
    if (i < 0.04) return { ar: 'مُحاق', tr: 'Yeni Ay' };
    if (i > 0.96) return { ar: 'بَدْر', tr: 'Dolunay' };
    if (Math.abs(i - 0.5) < 0.07) return p.wax ? { ar: 'تَربيع أوّل', tr: 'İlk Dördün' } : { ar: 'تَربيع أخير', tr: 'Son Dördün' };
    if (i < 0.5) return p.wax ? { ar: 'هِلال مُتزايد', tr: 'Büyüyen Hilal' } : { ar: 'هِلال مُتناقص', tr: 'Küçülen Hilal' };
    return p.wax ? { ar: 'أحدَب مُتزايد', tr: 'Büyüyen Şişkin Ay' } : { ar: 'أحدَب مُتناقص', tr: 'Küçülen Şişkin Ay' };
}

export function getTodayH() {
    const t = new Date();
    const [y, m, d] = jd2h(g2jd(t.getFullYear(), t.getMonth() + 1, t.getDate()));
    return { y, m, d };
}

export const noteKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

// ── Static data ───────────────────────────────────────────────────────────────

export const MONTHS = [
    { ar: 'المُحَرَّم', tr: 'Muharrem' }, { ar: 'صَفَر', tr: 'Safer' },
    { ar: 'رَبيع الأوّل', tr: 'Rebiülevvel' }, { ar: 'رَبيع الآخِر', tr: 'Rebiülahir' },
    { ar: 'جُمادى الأولى', tr: 'Cemaziyelevvel' }, { ar: 'جُمادى الآخِرة', tr: 'Cemaziyelahir' },
    { ar: 'رَجَب', tr: 'Recep' }, { ar: 'شَعْبان', tr: 'Şaban' },
    { ar: 'رَمَضان', tr: 'Ramazan' }, { ar: 'شَوّال', tr: 'Şevval' },
    { ar: 'ذو القَعْدة', tr: 'Zilkade' }, { ar: 'ذو الحِجّة', tr: 'Zilhicce' },
];
export const WD = ['الأحَد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخَميس', 'الجُمعة', 'السَّبت'];
export const GM = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
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

/**
 * The arithmetic Hijri calendar above can be a day off from Diyanet's (which sets month starts by
 * its own calculation), and a kandil reminder a day late is wrong. Where Diyanet's published
 * calendar is known, its date wins: key `<id>-<Hijri year>`, value the Gregorian day the calendar
 * marks (for a night, the day after the evening it starts). Extend it each year from the dini
 * günler takvimi; days not listed here fall back to the arithmetic calendar.
 * Sources: Diyanet's 2027 calendar as reported in the press, e.g. Miraç Kandili "4 Ocak 2027" is the evening of 4 Jan.
 */
const DIYANET_DATES: Record<string, string> = {
    'miraj-1448': '2027-01-05',
    'berat-1448': '2027-01-23',
    'ramadanArefe-1448': '2027-03-08',
    'fitr-1448': '2027-03-09',
    'tarwiyah-1448': '2027-05-14',
    'arafah-1448': '2027-05-15',
    'adha-1448': '2027-05-16',
    'mawlid-1449': '2027-08-14',
};

/** Julian day number of a special day in a Hijri year */
const specialDayJD = (def: SpecialDayDef, hy: number) => {
    const known = DIYANET_DATES[`${def.id}-${hy}`];
    if (known) {
        const [y, m, d] = known.split('-').map(Number);
        return g2jd(y, m, d);
    }
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

// ── Palettes (original "Midnight Emerald" dark + "Parchment Ink" light) ────────

export type HijriPalette = {
    bg: string; bgRadial: string; bgGlow: string;
    text: string; muted: string; gold: string; goldSoft: string;
    moonIvory: string; moonLit2: string; moonDark: string;
    line: string; panel: string; panelBorder: string;
    glowRGB: string; stars: boolean;
};

export const EMERALD: HijriPalette = {
    bg: '#0c2c1f',
    bgRadial: 'radial-gradient(125% 120% at 50% 16%, #14402e 0%, #0c2c1f 42%, #06180f 74%, #040f0a 100%)',
    bgGlow: 'rgba(20,64,46,0.6)',
    text: '#e8ebd2', muted: '#9cb8a6', gold: '#d8b24c', goldSoft: '#bd9a3f',
    moonIvory: '#edefdb', moonLit2: '#fbfcf0', moonDark: '#05150d',
    line: 'rgba(216,178,76,0.28)', panel: 'rgba(6,23,15,0.74)', panelBorder: 'rgba(216,178,76,0.36)',
    glowRGB: '216,178,76', stars: true,
};
export const LAPIS: HijriPalette = {
    bg: '#101d4a',
    bgRadial: 'radial-gradient(125% 120% at 50% 16%, #1d2f69 0%, #122152 40%, #0a1336 72%, #060b22 100%)',
    bgGlow: 'rgba(29,47,105,0.6)',
    text: '#ece4cc', muted: '#9bacd4', gold: '#e6c570', goldSoft: '#cbab5e',
    moonIvory: '#ece2c7', moonLit2: '#fbf7ec', moonDark: '#0b1535',
    line: 'rgba(220,184,86,0.30)', panel: 'rgba(11,20,52,0.74)', panelBorder: 'rgba(220,184,86,0.38)',
    glowRGB: '230,197,112', stars: true,
};

export const FONT = Platform.OS === 'web'
    ? { aref: 'Aref Ruqaa', amiri: 'Amiri', cormorant: 'Cormorant Garamond' }
    : { aref: undefined as any, amiri: undefined as any, cormorant: undefined as any };

export const NOTES_KEY = 'hijri-cal-notes';

export type HijriNoteEntry = { id: string; text: string; ts: number };

export const P_IN = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
export const STAGES = [-1, 0, 1];

export const STARS = Array.from({ length: 54 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.5 + 0.4, base: Math.random() * 0.5 + 0.2,
}));
