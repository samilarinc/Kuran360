import { TFunction } from 'i18next';
import { Surah } from '../types';

/** Sure adını aktif dile göre çeviri dosyasından (surahNames) getirir, yoksa data'daki isme düşer. */
export const getSurahName = (t: TFunction, surah: Pick<Surah, 'number' | 'name'>): string =>
    t(`surahNames.${surah.number}`, { defaultValue: surah.name });
