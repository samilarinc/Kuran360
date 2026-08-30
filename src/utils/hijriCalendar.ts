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
export const EVT: Record<number, Record<number, { ar: string; tr: string }>> = {
    1: { 1: { ar: 'رأس السنة الهجرية', tr: 'Hicri Yılbaşı' },
        10: { ar: 'يوم عاشوراء', tr: 'Aşure Günü' } },
    3: { 12: { ar: 'المولد النبوي', tr: 'Mevlid Kandili' } },
    7: { 27: { ar: 'الإسراء والمعراج', tr: 'Miraç Kandili' } },
    8: { 15: { ar: 'ليلة البَراءة', tr: 'Berat Kandili' } },
    9: { 1: { ar: 'أوّل رمضان', tr: 'Ramazan Başlangıcı' },
        27: { ar: 'ليلة القَدْر', tr: 'Kadir Gecesi' } },
    10: { 1: { ar: 'عيد الفِطر', tr: 'Ramazan Bayramı' } },
    12: { 8: { ar: 'يوم التَّروية', tr: 'Terviye Günü' },
        9: { ar: 'يوم عَرَفة', tr: 'Arefe Günü' },
        10: { ar: 'عيد الأضحى', tr: 'Kurban Bayramı' } },
};

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
