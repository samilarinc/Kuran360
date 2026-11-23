jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('expo-file-system/legacy', () => ({ documentDirectory: '' }));

import { getEdition, isArabicEdition, PENDING_TAFSIR_SOURCES, TAFSIR_SOURCES } from '../../src/services/tafsir';
import tr from '../../src/locales/tr.json';
import en from '../../src/locales/en.json';

describe('TAFSIR_SOURCES', () => {
    it('has a name, description and credit for every source in both languages', () => {
        for (const locale of [tr, en]) {
            for (const source of [...TAFSIR_SOURCES, ...PENDING_TAFSIR_SOURCES]) {
                const texts = (locale.tafsir.sources as Record<string, Record<string, string>>)[source.id];
                expect(texts?.name).toBeTruthy();
                expect(texts?.description).toBeTruthy();
                expect(texts?.credit).toBeTruthy();
            }
        }
    });

    it('gives every source its own editions, named by language', () => {
        const editions = [...TAFSIR_SOURCES, ...PENDING_TAFSIR_SOURCES].flatMap(source => Object.values(source.editions));
        expect(new Set(editions).size).toBe(editions.length);
        for (const edition of editions) expect(edition).toMatch(/^[a-z]+-(tr|en|ar)$/);
    });

    it('falls back to the Turkish edition for a language without its own', () => {
        const bilmen = TAFSIR_SOURCES.find(source => source.id === 'bilmen')!;
        expect(getEdition(bilmen, 'en')).toBe('bilmen-tr');
    });

    it('keeps the Arabic original in the Turkish slot of the classical tafsirs', () => {
        const celaleyn = PENDING_TAFSIR_SOURCES.find(source => source.id === 'celaleyn')!;
        expect(getEdition(celaleyn, 'en')).toBe('celaleyn-en');
        expect(getEdition(celaleyn, 'tr')).toBe('celaleyn-ar');
        const taberi = PENDING_TAFSIR_SOURCES.find(source => source.id === 'taberi')!;
        expect(isArabicEdition(getEdition(taberi, 'en'))).toBe(true);
        expect(isArabicEdition('saadi-tr')).toBe(false);
    });
});
