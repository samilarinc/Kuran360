/**
 * Allah's attributes (sıfatlar) as taught in the ilmihal: the six essential (zâtî) and eight
 * affirmative (sübûtî) attributes, a few of the acts that come from Tekvîn (fiilî), and the
 * attributes known only from the revealed texts (haberî). Names and explanations live in the
 * locale files under esmaulHusna.attributes; each attribute points to a verse that mentions it.
 */
export type AttributeGroupId = 'zati' | 'subuti' | 'fiili' | 'haberi';

export interface DivineAttribute {
    id: string;
    group: AttributeGroupId;
    arabic: string;
    /** 1-based verse number */
    verse: { surah: number; verse: number };
}

export const ATTRIBUTE_GROUPS: AttributeGroupId[] = ['zati', 'subuti', 'fiili', 'haberi'];

export const DIVINE_ATTRIBUTES: DivineAttribute[] = [
    { id: 'vucud', group: 'zati', arabic: 'الْوُجُودُ', verse: { surah: 14, verse: 10 } },
    { id: 'kidem', group: 'zati', arabic: 'الْقِدَمُ', verse: { surah: 57, verse: 3 } },
    { id: 'beka', group: 'zati', arabic: 'الْبَقَاءُ', verse: { surah: 55, verse: 27 } },
    { id: 'vahdaniyyet', group: 'zati', arabic: 'الْوَحْدَانِيَّةُ', verse: { surah: 112, verse: 1 } },
    { id: 'muhalefet', group: 'zati', arabic: 'مُخَالَفَةٌ لِلْحَوَادِثِ', verse: { surah: 42, verse: 11 } },
    { id: 'kiyam', group: 'zati', arabic: 'الْقِيَامُ بِنَفْسِهِ', verse: { surah: 35, verse: 15 } },

    { id: 'hayat', group: 'subuti', arabic: 'الْحَيَاةُ', verse: { surah: 2, verse: 255 } },
    { id: 'ilim', group: 'subuti', arabic: 'الْعِلْمُ', verse: { surah: 6, verse: 59 } },
    { id: 'semi', group: 'subuti', arabic: 'السَّمْعُ', verse: { surah: 58, verse: 1 } },
    { id: 'basar', group: 'subuti', arabic: 'الْبَصَرُ', verse: { surah: 96, verse: 14 } },
    { id: 'irade', group: 'subuti', arabic: 'الْإِرَادَةُ', verse: { surah: 85, verse: 16 } },
    { id: 'kudret', group: 'subuti', arabic: 'الْقُدْرَةُ', verse: { surah: 67, verse: 1 } },
    { id: 'kelam', group: 'subuti', arabic: 'الْكَلَامُ', verse: { surah: 4, verse: 164 } },
    { id: 'tekvin', group: 'subuti', arabic: 'التَّكْوِينُ', verse: { surah: 36, verse: 82 } },

    { id: 'halk', group: 'fiili', arabic: 'الْخَلْقُ', verse: { surah: 39, verse: 62 } },
    { id: 'rizk', group: 'fiili', arabic: 'التَّرْزِيقُ', verse: { surah: 51, verse: 58 } },
    { id: 'ihya', group: 'fiili', arabic: 'الْإِحْيَاءُ', verse: { surah: 30, verse: 50 } },
    { id: 'imate', group: 'fiili', arabic: 'الْإِمَاتَةُ', verse: { surah: 67, verse: 2 } },
    { id: 'magfiret', group: 'fiili', arabic: 'الْمَغْفِرَةُ', verse: { surah: 39, verse: 53 } },

    { id: 'vech', group: 'haberi', arabic: 'الْوَجْهُ', verse: { surah: 28, verse: 88 } },
    { id: 'yed', group: 'haberi', arabic: 'الْيَدُ', verse: { surah: 48, verse: 10 } },
    { id: 'istiva', group: 'haberi', arabic: 'الِاسْتِوَاءُ', verse: { surah: 20, verse: 5 } },
];
