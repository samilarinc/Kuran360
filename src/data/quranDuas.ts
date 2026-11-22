/**
 * The supplications (duas) in the Quran, for the "Duas in the Quran" screen.
 *
 * Only the references live here; the Arabic and the translation come from the app's own verse data, and
 * the names of people and topics plus each dua's short context are translated in the locale files:
 *   quranDuas.people.<person> / quranDuas.topics.<topic> / quranDuas.items.<dua id>
 *
 * The list covers the duas that begin with "Rabbanâ" / "Rabbi" / "Allâhumme", the duas of the prophets and
 * of righteous people, and the duas the Prophet was taught to say ("Say: My Lord ..."). The pleas of the
 * deniers and of the people of Hell (e.g. 23:107, 35:37, 44:12) are left out on purpose.
 */

export type DuaPerson =
    | 'adam' | 'nuh' | 'ibrahim' | 'lut' | 'yakub' | 'yusuf' | 'shuayb' | 'musa' | 'eyyub' | 'yunus'
    | 'zekeriya' | 'suleyman' | 'isa' | 'muhammad'
    | 'believers' | 'angels' | 'imranWife' | 'asiye' | 'belkis' | 'disciples' | 'talutArmy' | 'magicians'
    | 'caveYouths' | 'others';

export type DuaTopic =
    | 'forgiveness' | 'guidance' | 'knowledge' | 'family' | 'distress' | 'victory' | 'patience'
    | 'goodness' | 'hereafter' | 'gratitude' | 'refuge' | 'trust' | 'praise';

export interface QuranDua {
    /** `<surah>_<first verse>`; keys its context in the locale files. */
    id: string;
    surah: number;
    from: number;
    /** Last verse, for duas spanning several verses. */
    to?: number;
    who: DuaPerson;
    topics: DuaTopic[];
}

/** Prophets in the order they came, then everyone else; the order of the "by person" sections. */
export const DUA_PEOPLE: DuaPerson[] = [
    'adam', 'nuh', 'ibrahim', 'lut', 'yakub', 'yusuf', 'shuayb', 'musa', 'eyyub', 'yunus', 'zekeriya',
    'suleyman', 'isa', 'muhammad',
    'believers', 'angels', 'imranWife', 'asiye', 'belkis', 'disciples', 'talutArmy', 'magicians', 'caveYouths', 'others',
];

export const DUA_TOPICS: DuaTopic[] = [
    'forgiveness', 'guidance', 'knowledge', 'family', 'distress', 'victory', 'patience',
    'goodness', 'hereafter', 'gratitude', 'refuge', 'trust', 'praise',
];

const dua = (surah: number, from: number, to: number | undefined, who: DuaPerson, topics: DuaTopic[]): QuranDua =>
    ({ id: `${surah}_${from}`, surah, from, to, who, topics });

/** In mushaf order. */
export const QURAN_DUAS: QuranDua[] = [
    dua(1, 5, 7, 'muhammad', ['guidance', 'praise']),
    dua(2, 126, undefined, 'ibrahim', ['goodness']),
    dua(2, 127, undefined, 'ibrahim', ['goodness']),
    dua(2, 128, undefined, 'ibrahim', ['guidance', 'forgiveness', 'family']),
    dua(2, 129, undefined, 'ibrahim', ['guidance', 'knowledge']),
    dua(2, 201, undefined, 'believers', ['goodness', 'hereafter']),
    dua(2, 250, undefined, 'talutArmy', ['patience', 'victory']),
    dua(2, 260, undefined, 'ibrahim', ['guidance']),
    dua(2, 285, 286, 'believers', ['forgiveness', 'victory', 'patience']),
    dua(3, 8, 9, 'believers', ['guidance', 'hereafter']),
    dua(3, 16, undefined, 'believers', ['forgiveness', 'hereafter']),
    dua(3, 26, 27, 'muhammad', ['praise', 'goodness']),
    dua(3, 35, 36, 'imranWife', ['family', 'refuge']),
    dua(3, 38, undefined, 'zekeriya', ['family']),
    dua(3, 53, undefined, 'disciples', ['guidance']),
    dua(3, 147, undefined, 'believers', ['forgiveness', 'patience', 'victory']),
    dua(3, 173, undefined, 'believers', ['trust']),
    dua(3, 191, 194, 'believers', ['forgiveness', 'hereafter', 'praise']),
    dua(4, 75, undefined, 'believers', ['distress', 'victory']),
    dua(5, 25, undefined, 'musa', ['victory', 'distress']),
    dua(5, 83, 84, 'others', ['guidance']),
    dua(5, 114, undefined, 'isa', ['goodness']),
    dua(5, 118, undefined, 'isa', ['forgiveness']),
    dua(7, 23, undefined, 'adam', ['forgiveness']),
    dua(7, 47, undefined, 'others', ['hereafter']),
    dua(7, 89, undefined, 'shuayb', ['victory', 'trust']),
    dua(7, 126, undefined, 'magicians', ['patience', 'guidance']),
    dua(7, 143, undefined, 'musa', ['forgiveness']),
    dua(7, 151, undefined, 'musa', ['forgiveness']),
    dua(7, 155, 156, 'musa', ['forgiveness', 'goodness', 'hereafter']),
    dua(9, 129, undefined, 'muhammad', ['trust']),
    dua(10, 10, undefined, 'others', ['praise']),
    dua(10, 85, 86, 'believers', ['distress', 'trust']),
    dua(10, 88, 89, 'musa', ['victory']),
    dua(11, 45, 47, 'nuh', ['family', 'forgiveness', 'refuge']),
    dua(12, 33, undefined, 'yusuf', ['refuge', 'patience']),
    dua(12, 86, undefined, 'yakub', ['distress', 'patience']),
    dua(12, 101, undefined, 'yusuf', ['praise', 'guidance']),
    dua(14, 35, 41, 'ibrahim', ['family', 'guidance', 'forgiveness']),
    dua(17, 24, undefined, 'muhammad', ['family']),
    dua(17, 80, undefined, 'muhammad', ['victory', 'guidance']),
    dua(18, 10, undefined, 'caveYouths', ['guidance', 'distress']),
    dua(19, 3, 6, 'zekeriya', ['family']),
    dua(20, 25, 35, 'musa', ['knowledge', 'family']),
    dua(20, 45, undefined, 'musa', ['distress', 'refuge']),
    dua(20, 114, undefined, 'muhammad', ['knowledge']),
    dua(21, 83, 84, 'eyyub', ['distress', 'patience']),
    dua(21, 87, 88, 'yunus', ['distress', 'forgiveness']),
    dua(21, 89, 90, 'zekeriya', ['family']),
    dua(21, 112, undefined, 'muhammad', ['victory', 'trust']),
    dua(23, 26, undefined, 'nuh', ['victory']),
    dua(23, 29, undefined, 'nuh', ['goodness']),
    dua(23, 39, undefined, 'others', ['victory']),
    dua(23, 93, 94, 'muhammad', ['refuge']),
    dua(23, 97, 98, 'muhammad', ['refuge']),
    dua(23, 109, undefined, 'believers', ['forgiveness']),
    dua(23, 118, undefined, 'muhammad', ['forgiveness']),
    dua(25, 65, 66, 'believers', ['hereafter', 'refuge']),
    dua(25, 74, undefined, 'believers', ['family', 'guidance']),
    dua(26, 83, 89, 'ibrahim', ['knowledge', 'hereafter', 'family', 'forgiveness']),
    dua(26, 117, 118, 'nuh', ['victory', 'distress']),
    dua(26, 169, undefined, 'lut', ['distress', 'family']),
    dua(27, 19, undefined, 'suleyman', ['gratitude', 'guidance']),
    dua(27, 44, undefined, 'belkis', ['forgiveness', 'guidance']),
    dua(28, 16, undefined, 'musa', ['forgiveness']),
    dua(28, 17, undefined, 'musa', ['gratitude']),
    dua(28, 21, undefined, 'musa', ['distress', 'refuge']),
    dua(28, 22, undefined, 'musa', ['guidance']),
    dua(28, 24, undefined, 'musa', ['goodness', 'distress']),
    dua(29, 30, undefined, 'lut', ['victory']),
    dua(37, 100, undefined, 'ibrahim', ['family']),
    dua(38, 35, undefined, 'suleyman', ['forgiveness', 'goodness']),
    dua(38, 41, undefined, 'eyyub', ['distress', 'patience']),
    dua(39, 46, undefined, 'muhammad', ['praise', 'hereafter']),
    dua(40, 7, 9, 'angels', ['forgiveness', 'hereafter', 'family']),
    dua(43, 13, 14, 'muhammad', ['gratitude', 'praise']),
    dua(46, 15, undefined, 'believers', ['gratitude', 'family', 'forgiveness']),
    dua(54, 10, undefined, 'nuh', ['victory', 'distress']),
    dua(59, 10, undefined, 'believers', ['forgiveness', 'family']),
    dua(60, 4, 5, 'ibrahim', ['trust', 'forgiveness']),
    dua(66, 8, undefined, 'believers', ['hereafter', 'forgiveness']),
    dua(66, 11, undefined, 'asiye', ['hereafter', 'distress']),
    dua(71, 26, 28, 'nuh', ['forgiveness', 'family', 'victory']),
    dua(113, 1, 5, 'muhammad', ['refuge']),
    dua(114, 1, 6, 'muhammad', ['refuge']),
];

/** The verse numbers of a dua, from first to last. */
export const duaVerseNumbers = (d: QuranDua): number[] =>
    Array.from({ length: (d.to ?? d.from) - d.from + 1 }, (_, i) => d.from + i);
