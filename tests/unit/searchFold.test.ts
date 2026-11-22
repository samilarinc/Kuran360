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
