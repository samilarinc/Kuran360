import { foldForSearch, matchesSearch } from '../../src/utils/searchFold';
import { DIVINE_NAMES } from '../../src/data/esmaulHusna';
import tr from '../../src/locales/tr.json';
import en from '../../src/locales/en.json';

describe('foldForSearch', () => {
    it('drops accents, punctuation and case', () => {
        expect(foldForSearch('er-Rahmân')).toBe('errahman');
        expect(foldForSearch('Al-‘Azīz')).toBe('alaziz');
        expect(foldForSearch('el-Mü’min')).toBe('elmumin');
    });

    it('treats Turkish dotted and dotless i alike', () => {
        expect(foldForSearch('BAĞIŞLAYAN')).toBe(foldForSearch('bağişlayan'));
        expect(foldForSearch('İsim')).toBe('isim');
    });

    it('strips Arabic vowel marks', () => {
        expect(foldForSearch('الرَّحِيمُ')).toBe('الرحيم');
    });
});

describe('matchesSearch', () => {
    it('matches part of a transliteration without the article', () => {
        expect(matchesSearch('rahman', ['er-Rahmân'])).toBe(true);
        expect(matchesSearch('rahim', ['er-Rahmân'])).toBe(false);
    });

    it('needs every word to appear', () => {
        expect(matchesSearch('çok bağışlayan', ['el-Gaffâr', 'Günahları örten, çokça bağışlayan'])).toBe(true);
        expect(matchesSearch('çok sabırlı', ['el-Gaffâr', 'Günahları örten, çokça bağışlayan'])).toBe(false);
    });

    it('matches everything on an empty query', () => {
        expect(matchesSearch('  ', ['anything'])).toBe(true);
    });
});

describe('Esmaül Hüsna data', () => {
    it('has 99 names, each with a reading and meaning in both languages', () => {
        expect(DIVINE_NAMES).toHaveLength(99);
        for (const { number, arabic } of DIVINE_NAMES) {
            expect(arabic.length).toBeGreaterThan(0);
            for (const locale of [tr, en]) {
                const entry = (locale as any).esmaulHusna.names[String(number)];
                expect(entry?.name).toBeTruthy();
                expect(entry?.meaning).toBeTruthy();
            }
        }
    });
});

describe('Divine attributes data', () => {
    it('has a name, meaning and valid verse for each attribute, and texts for each group', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ATTRIBUTE_GROUPS, DIVINE_ATTRIBUTES } = require('../../src/data/divineAttributes');
        expect(DIVINE_ATTRIBUTES.filter((a: any) => a.group === 'zati')).toHaveLength(6);
        expect(DIVINE_ATTRIBUTES.filter((a: any) => a.group === 'subuti')).toHaveLength(8);
        for (const locale of [tr, en]) {
            const attributes = (locale as any).esmaulHusna.attributes;
            for (const group of ATTRIBUTE_GROUPS) {
                expect(attributes.groups[group]?.title).toBeTruthy();
                expect(attributes.groups[group]?.description).toBeTruthy();
            }
            for (const { id, verse } of DIVINE_ATTRIBUTES) {
                expect(attributes.items[id]?.name).toBeTruthy();
                expect(attributes.items[id]?.meaning).toBeTruthy();
                expect(verse.surah).toBeGreaterThanOrEqual(1);
                expect(verse.surah).toBeLessThanOrEqual(114);
                expect(verse.verse).toBeGreaterThanOrEqual(1);
            }
        }
    });
});
