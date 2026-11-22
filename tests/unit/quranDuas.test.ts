import { DUA_PEOPLE, DUA_TOPICS, duaVerseNumbers, QURAN_DUAS } from '../../src/data/quranDuas';
import tr from '../../src/locales/tr.json';
import en from '../../src/locales/en.json';

describe('Duas in the Quran', () => {
    it('lists each dua once, in mushaf order', () => {
        const ids = QURAN_DUAS.map(d => d.id);
        expect(new Set(ids).size).toBe(ids.length);
        const order = QURAN_DUAS.map(d => d.surah * 1000 + d.from);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
    });

    it('has valid verse ranges and at least one topic', () => {
        for (const dua of QURAN_DUAS) {
            expect(dua.surah).toBeGreaterThanOrEqual(1);
            expect(dua.surah).toBeLessThanOrEqual(114);
            expect(dua.from).toBeGreaterThanOrEqual(1);
            expect(duaVerseNumbers(dua).length).toBeGreaterThanOrEqual(1);
            expect(dua.topics.length).toBeGreaterThan(0);
        }
    });

    it.each([['tr', tr], ['en', en]])('has every text in %s', (_, locale: any) => {
        for (const dua of QURAN_DUAS) expect(locale.quranDuas.items[dua.id]).toBeTruthy();
        for (const person of DUA_PEOPLE) expect(locale.quranDuas.people[person]).toBeTruthy();
        for (const topic of DUA_TOPICS) expect(locale.quranDuas.topics[topic]).toBeTruthy();
    });
});
