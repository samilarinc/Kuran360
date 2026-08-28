import { TFunction } from 'i18next';
import { Surah } from '../types';
import { getSurahsList } from '../data/quranData';

/** Sure adını aktif dile göre çeviri dosyasından (surahNames) getirir, yoksa data'daki isme düşer. */
export const getSurahName = (t: TFunction, surah: Pick<Surah, 'number' | 'name'>): string =>
    t(`surahNames.${surah.number}`, { defaultValue: surah.name });

/** Sure numarasından sure adını bulur (getSurahName'in numaradan arayan hali). */
export const getSurahNameByNumber = (t: TFunction, surahNumber: number): string => {
    const surah = getSurahsList().find(s => s.number === surahNumber);
    return surah ? getSurahName(t, surah) : `${surahNumber}`;
};
