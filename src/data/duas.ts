import { Platform } from 'react-native';

/**
 * Ready-made duas for the duas screen.
 *
 * The Arabic and the transliteration live here; titles, descriptions and the meaning of each part are
 * translated and live in the locale files:
 *   duas.items.<dua id>.title / .description / .source
 *   duas.items.<dua id>.parts (one meaning per part, in order)
 */

export interface DuaPart {
    arabic: string;
    transliteration?: string;
    /** Second the recording reaches this part, for duas with audio. */
    start?: number;
    /** Second each word of `arabic` (split at spaces) starts, for word-by-word highlighting. */
    words?: number[];
    /** A piece written about this part, linked under its meaning. */
    article?: { title: string; url: string };
}

export interface Dua {
    id: string;
    parts: DuaPart[];
    audio?: { url: string; reciter?: string };
}

const BASE_URL = Platform.OS === 'web' ? '' : 'https://kuran360.com';

export const DUAS: Dua[] = [
    {
        id: 'kunutKadir',
        audio: { url: `${BASE_URL}/audio/kunut-kadir.m4a`, reciter: 'Hatem Farid Al Wa\'er' },
        parts: [
            {
                start: 0.7,
                words: [1.02, 2.42, 3.52, 4.04, 4.84, 5.74, 6.46, 7.4, 8.5, 9.51, 10.56, 11.48, 12.04, 12.54, 13.8, 14.28, 14.78, 15.18],
                arabic: 'اَللّٰهُمَّ اهْدِنَا فِيمَنْ هَدَيْتَ، وَعَافِنَا فِيمَنْ عَافَيْتَ، وَتَوَلَّنَا فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لَنَا فِيمَا أَعْطَيْتَ، وَقِنَا شَرَّ مَا قَضَيْتَ',
                transliteration: 'Allâhümme\'hdinâ fî men hedeyt, ve âfinâ fî men âfeyt, ve tevellenâ fî men tevelleyt, ve bârik lenâ fî mâ a\'tayt, ve kınâ şerra mâ kadayt.',
            },
            {
                start: 15.8,
                words: [16.12, 17.2, 17.96, 18.32, 19.2, 20.18, 21.08, 21.44, 22.32, 22.56, 23.48, 23.84, 24.72, 25.08, 26.25, 27.12, 28.02, 29.46, 29.64, 31.22, 32.2, 32.82],
                arabic: 'فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، وَلَا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ، لَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ',
                transliteration: 'Fe inneke takdî ve lâ yukdâ aleyk, ve innehû lâ yezillü men vâleyt, ve lâ ye\'izzü men âdeyt, tebârekte Rabbenâ ve teâleyt, lâ mencâ minke illâ ileyk.',
            },
            {
                start: 33.7,
                words: [34.04, 35.14, 35.68, 36.18, 36.86, 38.06, 39.46, 40.64, 41.6, 42.5],
                arabic: 'اَللّٰهُمَّ اغْفِرْ لَنَا جِدَّنَا وَهَزْلَنَا وَخَطَأَنَا وَعَمْدَنَا، وَكُلُّ ذَلِكَ عِنْدَنَا',
                transliteration: 'Allâhümmağfir lenâ ciddenâ ve hezlenâ ve hata\'enâ ve amdenâ, ve küllü zâlike indenâ.',
            },
            {
                start: 43.6,
                words: [43.88, 45.28, 46.52, 46.98, 48.4, 49.32, 50.92, 51.62, 53.08, 54.15, 55.44, 56.36, 57.64, 58.8, 60.1],
                arabic: 'اَللّٰهُمَّ اجْعَلْنَا لَكَ ذَكَّارِينَ، لَكَ شَكَّارِينَ، لَكَ رَهَّابِينَ، لَكَ مِطْوَاعِينَ، لَكَ مُخْبِتِينَ، إِلَيْكَ أَوَّاهِينَ مُنِيبِينَ',
                transliteration: 'Allâhümme\'c\'alnâ leke zekkârîn, leke şekkârîn, leke rehhâbîn, leke mitvâîn, leke muhbitîn, ileyke evvâhîne münîbîn.',
            },
            {
                start: 61.9,
                words: [62.2, 63.08, 64.16, 65.54, 66.44, 67.58, 68.78, 70.4, 71.48, 72.88, 74.13, 75.06, 76.52, 77.4, 77.96, 79.18, 80.36, 80.68],
                arabic: 'اَللّٰهُمَّ تَقَبَّلْ تَوْبَتَنَا، وَاغْسِلْ حَوْبَتَنَا، وَأَجِبْ دَعْوَتَنَا، وَسَدِّدْ أَلْسِنَتَنَا، وَاسْلُلْ سَخِيمَةَ صُدُورِنَا، وَانْزِعِ الْغِلَّ وَالْحِقْدَ وَالْحَسَدَ مِنْ قُلُوبِنَا',
                transliteration: 'Allâhümme tekabbel tevbetenâ, vağsil havbetenâ, ve ecib da\'vetenâ, ve seddid elsinetenâ, veslül sahîmete sudûrinâ, venzi\'il-ğılle ve\'l-hıkde ve\'l-hasede min kulûbinâ.',
            },
            {
                start: 81.9,
                words: [82.24, 83.92, 85.5, 87.4, 89.04, 90.3, 90.98, 92.04],
                article: { title: 'İsyan ve Kayboluş', url: 'https://blog.msarinc.com.tr/post/isyan_ve_kaybolus' },
                arabic: 'عَصَيْنَاكَ فَأَمْهَلْتَنَا، وَأَطَعْنَاكَ فَشَكَرْتَنَا، وَإِنْ عُدْنَا إِلَيْكَ قَبِلْتَنَا',
                transliteration: 'Asaynâke fe emheltenâ, ve eta\'nâke fe şekertenâ, ve in udnâ ileyke kabiltenâ.',
            },
            {
                start: 93.7,
                words: [94.04, 94.94, 97.74, 98.44, 101.32, 102.08],
                arabic: 'رَبٌّ كَرِيمٌ، رَبٌّ شَكُورٌ، رَبٌّ غَفُورٌ',
                transliteration: 'Rabbün kerîm, Rabbün şekûr, Rabbün ğafûr.',
            },
            {
                start: 104.3,
                words: [104.64, 105.36, 105.72, 112.44, 113.24, 113.62, 117.7, 118.22, 118.74, 123.38, 123.86, 124.34, 128.3, 128.88, 129.46, 132.28, 136.22, 137.43, 138.64, 140.56, 141.11, 141.66],
                arabic: 'رَبِّ مَا أَحْلَمَكَ، رَبِّ مَا أَرْحَمَكَ، رَبِّ مَا أَرْحَمَكَ، رَبِّ مَا أَحْلَمَكَ، رَبِّ مَا أَعْلَمَكَ، رَبَّنَا، رَبِّ مَا أَحْلَمَكَ، رَبِّ مَا أَرْحَمَكَ',
                transliteration: 'Rabbi mâ ahlemek, Rabbi mâ erhamek, Rabbi mâ erhamek, Rabbi mâ ahlemek, Rabbi mâ a\'lemek, Rabbenâ, Rabbi mâ ahlemek, Rabbi mâ erhamek.',
            },
            {
                start: 145.1,
                words: [145.42, 146.82, 147.78, 148.34, 149.6, 150.6, 151.32, 152.06],
                arabic: 'اَللّٰهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنَّا',
                transliteration: 'Allâhümme inneke afüvvün kerîmün tühibbü\'l-afve fa\'fü annâ.',
            },
            {
                start: 153,
                words: [153.26, 154.46, 154.76, 155.48, 156.62, 157.5, 157.8, 158.88, 159.92, 160.84, 161.08, 162.16, 163.02, 164.12, 164.42, 165.4],
                arabic: 'عَفْوَكَ يَا عَفُوُّ عَفْوَكَ، عَفْوَكَ يَا رَحْمٰنُ عَفْوَكَ، عَفْوَكَ يَا رَحِيمُ عَفْوَكَ، عَفْوَكَ يَا حَلِيمُ عَفْوَكَ',
                transliteration: 'Afveke yâ Afüvvü afvek, afveke yâ Rahmânü afvek, afveke yâ Rahîmü afvek, afveke yâ Halîmü afvek.',
            },
            {
                start: 166,
                words: [166.26, 166.6, 167.4, 168.42, 169.14, 170.14, 170.94, 171.46, 172.32, 173.24, 174.54, 176.02, 177.02, 177.84, 178.7, 179.9, 180.78, 181.92, 183.4, 184.22, 185.36, 186.3, 187.18, 188.1, 188.42, 189.28, 190.26, 191.2, 191.52, 192.52],
                arabic: 'فِي الْمَحْيَا عَفْوَكَ، وَفِي الْمَمَاتِ عَفْوَكَ، وَفِي الْقُبُورِ عَفْوَكَ، وَعِنْدَ النُّشُورِ عَفْوَكَ، وَعِنْدَ مَمَرِّ الصِّرَاطِ عَفْوَكَ، وَعِنْدَ الْمِيزَانِ عَفْوَكَ، وَعِنْدَ الْحِسَابِ عَفْوَكَ، عَفْوَكَ يَا عَفُوُّ عَفْوَكَ، عَفْوَكَ يَا حَلِيمُ عَفْوَكَ',
                transliteration: 'Fi\'l-mahyâ afvek, ve fi\'l-memâti afvek, ve fi\'l-kubûri afvek, ve inde\'n-nüşûri afvek, ve inde memerri\'s-sırâti afvek, ve inde\'l-mîzâni afvek, ve inde\'l-hisâbi afvek, afveke yâ Afüvvü afvek, afveke yâ Halîmü afvek.',
            },
            {
                start: 193.1,
                words: [193.38, 196.04, 197.5, 199, 200.94, 202.18, 203.98, 204.44, 205.48, 207, 207.86, 208.92, 209.36, 210.64, 210.88, 211.66],
                arabic: 'إِلٰهَنَا وَخَالِقَنَا وَرَازِقَنَا، إِنْ كَانَ الْبُكَاءُ عَلَى عَزِيزٍ فَنَحْنُ أَوْلَى بِالْبُكَاءِ عَلَى رَمَضَانَ يَا رَبَّ الْعَالَمِينَ',
                transliteration: 'İlâhenâ ve hâlikanâ ve râzikanâ, in kâne\'l-bükâü alâ azîzin fe nahnü evlâ bi\'l-bükâi alâ Ramazân, yâ Rabbe\'l-âlemîn.',
            },
            {
                start: 213.1,
                words: [213.36, 214.76, 215.56, 216.86, 218.48, 219.68, 221.3, 222.64, 224.34, 225.9, 226.76, 227.22, 231.4, 233.24, 234.2, 234.7, 235.44],
                arabic: 'يَا رَبَّ رَمَضَانَ، ذَهَبَ رَمَضَانُ، وَذَهَبَتِ الْأَيَّامُ وَاللَّيَالِي، وَلَمْ يَبْقَ لَنَا سِوَاكَ، أَنْتَ الْحَيُّ الَّذِي لَا يَمُوتُ',
                transliteration: 'Yâ Rabbe Ramazân, zehebe Ramazân, ve zehebeti\'l-eyyâmü ve\'l-leyâlî, ve lem yebka lenâ sivâk, ente\'l-hayyü\'llezî lâ yemût.',
            },
            {
                start: 244.3,
                words: [244.64, 246.04, 246.58, 248.08, 249, 249.44, 250.78, 251.14, 252.32, 252.72, 254.14, 254.52, 255.38],
                arabic: 'اَللّٰهُمَّ لَا تَحْرِمْنَا فَضْلَكَ وَلَا جُودَكَ وَلَا كَرَمَكَ بَعْدَ رَمَضَانَ يَا رَبَّ الْعَالَمِينَ',
                transliteration: 'Allâhümme lâ tahrimnâ fadleke ve lâ cûdeke ve lâ keremeke ba\'de Ramazân, yâ Rabbe\'l-âlemîn.',
            },
            {
                start: 257.2,
                words: [257.46, 258.06, 258.38, 258.84, 259.58, 260.76, 261.32, 261.9, 262.78],
                arabic: 'وَصَلَّى اللّٰهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ',
                transliteration: 'Ve sallallâhü alâ seyyidinâ Muhammedin ve alâ âlihî ve sahbihî ecmaîn.',
            },
        ],
    },
];

/** Index of the part a recording is in at `seconds`, or -1 before the first one. */
export const partAtTime = (dua: Dua, seconds: number) =>
    dua.parts.reduce((current, part, index) => (part.start !== undefined && part.start <= seconds ? index : current), -1);
