import {
    g2jd, jd2g, jd2h, hMonthLen, hijriToDate, getSpecialDay, specialDaysOfYear, specialDaysBetween, leapG, addHM,
} from '@/utils/hijriCalendar';

const ymd = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];
const hijriOf = (y: number, m: number, d: number) => jd2h(g2jd(y, m, d));

describe('Gregorian ↔ Julian day', () => {
    it('round-trips every day of a leap and a common year', () => {
        for (const year of [2024, 2027]) {
            for (let jd = g2jd(year, 1, 1); jd < g2jd(year + 1, 1, 1); jd++) {
                expect(g2jd(...jd2g(jd))).toBe(jd);
            }
        }
    });

    it('knows leap years', () => {
        expect([2000, 2024, 2028].map(leapG)).toEqual([true, true, true]);
        expect([1900, 2026, 2100].map(leapG)).toEqual([false, false, false]);
    });
});

describe('Hijri dates follow Diyanet month starts', () => {
    it('maps bundled month starts to day 1', () => {
        expect(hijriOf(2026, 11, 10)).toEqual([1448, 6, 1]);
        expect(hijriOf(2027, 3, 9)).toEqual([1448, 10, 1]);
        expect(ymd(hijriToDate(1448, 12, 1))).toEqual([2027, 5, 7]);
    });

    it('counts days inside a month', () => {
        expect(hijriOf(2026, 11, 23)).toEqual([1448, 6, 14]);
        expect(hijriOf(2026, 12, 9)).toEqual([1448, 6, 30]);
        expect(hMonthLen(1448, 6)).toBe(30);
    });

    it('wraps months across years', () => {
        expect(addHM(1447, 12, 1)).toEqual([1448, 1]);
        expect(addHM(1448, 1, -1)).toEqual([1447, 12]);
    });

    it('never skips or repeats a day across 1447–1449', () => {
        let prev = hijriOf(2025, 7, 1);
        for (let jd = g2jd(2025, 7, 2); jd < g2jd(2028, 1, 1); jd++) {
            const cur = jd2h(jd);
            const sameMonth = cur[0] === prev[0] && cur[1] === prev[1];
            if (sameMonth) expect(cur[2]).toBe(prev[2] + 1);
            else {
                expect(cur[2]).toBe(1);
                expect(addHM(prev[0], prev[1], 1)).toEqual([cur[0], cur[1]]);
                expect([29, 30]).toContain(prev[2]);
            }
            prev = cur;
        }
    });
});

describe('special days', () => {
    // Dates from Diyanet's 2027 dini günler takvimi
    const marked = Object.fromEntries(specialDaysOfYear(1448).map(d => [d.def.id, ymd(d.date)]));

    it('matches the Diyanet calendar', () => {
        // Kandils are marked on the day after the night, like Diyanet lists them (Regaib: night of Thu 10 Dec)
        expect(marked.regaib).toEqual([2026, 12, 11]);
        expect(marked.miraj).toEqual([2027, 1, 5]);
        expect(marked.berat).toEqual([2027, 1, 23]);
        expect(marked.ramadanArefe).toEqual([2027, 3, 8]);
        expect(marked.fitr).toEqual([2027, 3, 9]);
        expect(marked.adha).toEqual([2027, 5, 16]);
    });

    it('puts Regaib on the first Friday of Recep', () => {
        const regaib = specialDaysOfYear(1448).find(d => d.def.id === 'regaib')!;
        expect(regaib.date.getDay()).toBe(5);
        expect(regaib.month).toBe(7);
        expect(regaib.day).toBeLessThanOrEqual(7);
    });

    it('finds the special day on a Hijri date', () => {
        expect(getSpecialDay(1448, 8, 15)?.id).toBe('berat');
        expect(getSpecialDay(1448, 8, 16)).toBeUndefined();
    });

    it('starts kandil nights the evening before', () => {
        const days = specialDaysBetween(new Date(2027, 0, 1), new Date(2027, 0, 31));
        const miraj = days.find(d => d.def.id === 'miraj')!;
        expect(ymd(miraj.startDate)).toEqual([2027, 1, 4]);
        const ids = days.map(d => d.def.id);
        expect(ids).toEqual(['miraj', 'berat']);
    });
});
