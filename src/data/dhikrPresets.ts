/**
 * Built-in dhikr presets for the zikirmatik screen.
 *
 * The Arabic and the transliteration (as printed in the Turkish tesbihat booklets) live here;
 * names, descriptions, meanings and instructions are translated and live in the locale files:
 *   zikirmatik.presets.<preset id>.name / .description
 *   zikirmatik.texts.<text id>.meaning / .note
 */

export interface DhikrStep {
    /** Key for the step's meaning and note in the locale files (`zikirmatik.texts.<id>`). */
    id: string;
    arabic?: string;
    transliteration?: string;
    /** Said instead on the last repetition of a counted step. */
    last?: { arabic?: string; transliteration?: string };
    /** Times to say it. Steps without a count are read once and moved past with "next". */
    count?: number;
    /** Opens this verse on request instead of printing it (e.g. Ayetü'l-Kürsî). */
    verse?: { surah: number; verseIndex: number };
}

export interface DhikrPreset {
    id: string;
    steps: DhikrStep[];
    /** Whether the user can change the target (single-step presets only). */
    adjustableTarget?: boolean;
}

const SUBHANALLAH = { id: 'subhanallah', arabic: 'سُبْحَانَ اللّٰهِ', transliteration: 'Subhânallah' };
const ELHAMDULILLAH = { id: 'elhamdulillah', arabic: 'اَلْحَمْدُ لِلّٰهِ', transliteration: 'Elhamdülillâh' };
const ALLAHU_EKBER = { id: 'allahuEkber', arabic: 'اَللّٰهُ أَكْبَرُ', transliteration: 'Allâhu Ekber' };
const TEVHID = { id: 'tevhid', arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ', transliteration: 'Lâ ilâhe illallâh' };
const TEVHID_FULL = {
    id: 'tevhidFull',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'Lâ ilâhe illallâhu vahdehû lâ şerîke leh, lehü\'l-mülkü ve lehü\'l-hamdü ve hüve alâ külli şey\'in kadîr.',
};
const ISTIGFAR = { id: 'istigfar', arabic: 'أَسْتَغْفِرُ اللّٰهَ', transliteration: 'Estağfirullah' };
const SALAVAT = { id: 'salavat', arabic: 'اَللّٰهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ', transliteration: 'Allâhümme salli alâ Seyyidinâ Muhammed' };
const HAVQALA = { id: 'havqala', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ', transliteration: 'Lâ havle ve lâ kuvvete illâ billâh' };

/** [transliteration, Arabic] */
const ESMA: [string, string][] = [
    ['Cemîl', 'جَمِيلُ'], ['Karîb', 'قَرِيبُ'], ['Mucîb', 'مُجِيبُ'], ['Habîb', 'حَبِيبُ'], ['Raûf', 'رَؤُوفُ'],
    ['Atûf', 'عَطُوفُ'], ['Ma\'ruf', 'مَعْرُوفُ'], ['Lâtîf', 'لَطِيفُ'], ['Azîm', 'عَظِيمُ'], ['Hannân', 'حَنَّانُ'],
    ['Mennân', 'مَنَّانُ'], ['Deyyân', 'دَيَّانُ'], ['Subhân', 'سُبْحَانُ'], ['Emân', 'أَمَانُ'], ['Burhân', 'بُرْهَانُ'],
    ['Sultân', 'سُلْطَانُ'], ['Müsteân', 'مُسْتَعَانُ'], ['Muhsin', 'مُحْسِنُ'], ['Müteâl', 'مُتَعَالِي'], ['Rahmân', 'رَحْمٰنُ'],
    ['Rahîm', 'رَحِيمُ'], ['Kerîm', 'كَرِيمُ'], ['Mecîd', 'مَجِيدُ'], ['Ferd', 'فَرْدُ'], ['Vitr', 'وِتْرُ'],
    ['Ehad', 'أَحَدُ'], ['Samed', 'صَمَدُ'], ['Mahmûd', 'مَحْمُودُ'], ['Sâdıka\'l-Va\'d', 'صَادِقَ الْوَعْدِ'], ['Aliyy', 'عَلِيُّ'],
    ['Ğaniyy', 'غَنِيُّ'], ['Şâfî', 'شَافِي'], ['Kâfî', 'كَافِي'], ['Muâfî', 'مُعَافِي'], ['Bâkî', 'بَاقِي'],
    ['Hâdî', 'هَادِي'], ['Kâdir', 'قَادِرُ'], ['Sâtir', 'سَاتِرُ'], ['Kahhâr', 'قَهَّارُ'], ['Cebbâr', 'جَبَّارُ'],
    ['Ğaffâr', 'غَفَّارُ'], ['Fettâh', 'فَتَّاحُ'],
];

/** Küçük Tesbihat, in the order it's read after the farz prayers. */
const KUCUK_TESBIHAT: DhikrStep[] = [
    {
        id: 'selam',
        transliteration: 'Allâhümme ente\'s-selâmü ve minke\'s-selâm, tebârekte yâ ze\'l-celâli ve\'l-ikrâm.',
        arabic: 'اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    },
    {
        id: 'salatenTuncina',
        arabic: 'اَللّٰهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِ سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْآفَاتِ، وَتَقْضِي لَنَا بِهَا جَمِيعَ الْحَاجَاتِ، وَتُطَهِّرُنَا بِهَا مِنْ جَمِيعِ السَّيِّئَاتِ، وَتَرْفَعُنَا بِهَا عِنْدَكَ أَعْلَى الدَّرَجَاتِ، وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ مِنْ جَمِيعِ الْخَيْرَاتِ فِي الْحَيَاةِ وَبَعْدَ الْمَمَاتِ. آمِينَ يَا مُجِيبَ الدَّعَوَاتِ، وَالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ',
        transliteration: 'Allâhümme salli alâ Seyyidinâ Muhammedin ve alâ âli Seyyidinâ Muhammed Salâten tüncînâ bihâ min-cemî\'l-ehvâli ve\'l-âfat ve takdîlenâ bi-hâ cemîa\'l-hâcât ve tutahhirunâ bi-hâ min-cemî\'is-seyyiât ve terfeunâ bi-hâ indeke a\'le\'d-deracât ve tubelliğunâ bi-hâ aksâ\'l-ğayât min cemî\'l-hayrâti fi\'l-hayâti ve ba\'del-memât. Âmin yâ Mucîbe\'d-deavât ve\'l-hamdü lillâhi Rabbi\'l-âlemîn.',
    },
    {
        id: 'alaRasulina',
        transliteration: 'Alâ Rasûlinâ Salavât\n(Allâhümme salli alâ Seyyidinâ Muhammed)',
        arabic: 'عَلَىٰ رَسُولِنَا صَلَوَاتٌ\n(اَللّٰهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ)',
    },
    {
        id: 'tesbihatDuasi',
        transliteration: 'Subhânallâhi ve\'l-hamdü lillâhi ve lâ ilâhe illallâhü vallâhü ekber ve lâ havle ve lâ kuvvete illâ billâhi\'l-aliyyi\'l-azîm.',
        arabic: 'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',
    },
    { id: 'ayetelKursi', verse: { surah: 2, verseIndex: 254 } },
    { id: 'zulCelali', transliteration: 'Zül Celâli Subhânallâh', arabic: SUBHANALLAH.arabic, count: 33 },
    { id: 'zulCemali', transliteration: 'Zül Cemâli\'l-hamdülillâh', arabic: ELHAMDULILLAH.arabic, count: 33 },
    { id: 'zulKemali', transliteration: 'Zül Kemâli Allâhu Ekber', arabic: ALLAHU_EKBER.arabic, count: 33 },
    { ...TEVHID_FULL, id: 'tevhidFullKucuk' },
    {
        id: 'subhaneRabbiye',
        transliteration: 'Subhâne Rabbiye\'l-aliyyi\'l-â\'le\'l-vehhâb.',
        arabic: 'سُبْحَانَ رَبِّيَ الْعَلِيِّ الْأَعْلَى الْوَهَّابِ',
    },
    { id: 'dua' },
    { id: 'faalem', transliteration: 'Fâ\'lem ennehû', arabic: 'فَاعْلَمْ أَنَّهُ', count: 1 },
    { ...TEVHID, id: 'tevhidKucuk', transliteration: 'Lâ ilâhe illâllah', count: 33 },
    {
        id: 'muhammedurResulullah',
        transliteration: 'Muhammedu\'r-resûlullâhi sallâllâhu teâlâ aleyhi ve sellem.',
        arabic: 'مُحَمَّدٌ رَسُولُ اللّٰهِ صَلَّى اللّٰهُ تَعَالَىٰ عَلَيْهِ وَسَلَّمَ',
        count: 1,
    },
    {
        id: 'innallahe',
        transliteration: 'İnnallâhe ve melâiketehû yusallûne ale\'n-nebiy. Yâ eyyühellezîne âmenû sallû aleyhi ve sellimû teslîmâ. Lebbeyk.',
        arabic: 'إِنَّ اللّٰهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا. لَبَّيْكَ',
    },
    {
        id: 'kesira',
        transliteration: 'Allahümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Bi-adedi külli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim kesîrâ',
        arabic: 'اَللّٰهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِ سَيِّدِنَا مُحَمَّدٍ، بِعَدَدِ كُلِّ دَاءٍ وَدَوَاءٍ، وَبَارِكْ وَسَلِّمْ عَلَيْهِ وَعَلَيْهِمْ كَثِيرًا',
        last: {
            transliteration: 'Allahümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Bi-adedi külli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim kesîran kesîrâ',
            arabic: 'اَللّٰهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِ سَيِّدِنَا مُحَمَّدٍ، بِعَدَدِ كُلِّ دَاءٍ وَدَوَاءٍ، وَبَارِكْ وَسَلِّمْ عَلَيْهِ وَعَلَيْهِمْ كَثِيرًا كَثِيرًا',
        },
        count: 3,
    },
    {
        id: 'salliVeSellim',
        transliteration: 'Salli ve sellim yâ Rabbi alâ habîbike Muhammedin ve alâ cemîi\'l-enbiyâi ve\'l mürselîne ve alâ âli küllin ve sahbi küllin ecmaîn. Âmin ve\'l-hamdü lillâhi Rabbi\'l-âlemîn.',
        arabic: 'صَلِّ وَسَلِّمْ يَا رَبِّ عَلَىٰ حَبِيبِكَ مُحَمَّدٍ وَعَلَىٰ جَمِيعِ الْأَنْبِيَاءِ وَالْمُرْسَلِينَ، وَعَلَىٰ آلِ كُلٍّ وَصَحْبِ كُلٍّ أَجْمَعِينَ. آمِينَ وَالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ',
    },
    {
        id: 'elfuElfi',
        transliteration: 'Elfü elfi salâtin ve elfü elfi selâmin aleyke yâ Rasûlallâh.\nElfü elfi salâtin ve elfü elfi selâmin aleyke yâ Habîballâh.\nElfü elfi salâtin ve elfü elfi selâmin aleyke yâ emîne vahyillâh.',
        arabic: [
            'أَلْفُ أَلْفِ صَلَاةٍ وَأَلْفُ أَلْفِ سَلَامٍ عَلَيْكَ يَا رَسُولَ اللّٰهِ',
            'أَلْفُ أَلْفِ صَلَاةٍ وَأَلْفُ أَلْفِ سَلَامٍ عَلَيْكَ يَا حَبِيبَ اللّٰهِ',
            'أَلْفُ أَلْفِ صَلَاةٍ وَأَلْفُ أَلْفِ سَلَامٍ عَلَيْكَ يَا أَمِينَ وَحْيِ اللّٰهِ',
        ].join('\n'),
    },
    {
        id: 'resailiNur',
        transliteration: 'Allâhümme salli ve sellim ve bârik alâ seyyidinâ Muhammedin ve alâ âlihî ve ashâbihî bi-adedi evrakı\'l-eşcâr ve emvâci\'l-bihâr ve katarâti\'l-emtâr, vağfir lenâ verhamnâ veltuf binâ vebi üstâdinâ Saîde\'n-Nursî (radiyallâhu anh) ve vâlideynâ vebi talebeti Resâili\'n-Nûri\'s-sadıkîne yâ ilâhenâ bi-külli salâtin minhâ Eşhedü en lâ ilâhe illâllah ve eşhedü enne Muhammede\'r-Rasûlullâhi sallallâhü teâlâ aleyhi ve sellem.',
        arabic: 'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِهِ وَأَصْحَابِهِ بِعَدَدِ أَوْرَاقِ الْأَشْجَارِ وَأَمْوَاجِ الْبِحَارِ وَقَطَرَاتِ الْأَمْطَارِ، وَاغْفِرْ لَنَا وَارْحَمْنَا وَالْطُفْ بِنَا وَبِأُسْتَاذِنَا سَعِيدٍ النُّورْسِيِّ (رَضِيَ اللّٰهُ عَنْهُ) وَوَالِدَيْنَا وَبِطَلَبَةِ رَسَائِلِ النُّورِ الصَّادِقِينَ، يَا إِلٰهَنَا بِكُلِّ صَلَاةٍ مِنْهَا، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللّٰهِ صَلَّى اللّٰهُ تَعَالَىٰ عَلَيْهِ وَسَلَّمَ',
    },
    {
        id: 'esma',
        transliteration: ESMA.map(([name]) => `Yâ ${name} yâ Allah`).join('\n'),
        arabic: ESMA.map(([, name]) => `يَا ${name} يَا اَللّٰهُ`).join('\n'),
    },
    {
        id: 'sonDua',
        transliteration: 'Yâ Rabbe\'s-semâvâti ve\'l-ardı, yâ ze\'l-celâli ve\'l-ikrâm. Es\'elüke bi-hakkı hâzihi\'l-esmâi küllihâ entüsalliye alâ seyyidinâ Muhammedin ve alâ âli Muhammedin, verham Muhammeden kemâ salleyte ve sellemte ve bârekte ve rahimte ve terahhamte alâ İbrâhîme ve alâ âli İbrâhîme fi\'l-âlemîn, Rabbenâ inneke hamîdü\'m-mecîd, bi-rahmetike yâ erhamerrâhimîn, ve\'l-hamdülillâhi Rabbi\'l-âlemîn.',
        arabic: 'يَا رَبَّ السَّمٰوَاتِ وَالْأَرْضِ، يَا ذَا الْجَلَالِ وَالْإِكْرَامِ، أَسْأَلُكَ بِحَقِّ هٰذِهِ الْأَسْمَاءِ كُلِّهَا أَنْ تُصَلِّيَ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، وَارْحَمْ مُحَمَّدًا كَمَا صَلَّيْتَ وَسَلَّمْتَ وَبَارَكْتَ وَرَحِمْتَ وَتَرَحَّمْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ فِي الْعَالَمِينَ، رَبَّنَا إِنَّكَ حَمِيدٌ مَجِيدٌ، بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ، وَالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ',
    },
];

export const FREE_COUNTER_ID = 'free';
export const DEFAULT_TARGET = 33;
export const TARGET_OPTIONS = [33, 99, 100, 500, 1000];

export const DHIKR_PRESETS: DhikrPreset[] = [
    { id: FREE_COUNTER_ID, steps: [{ id: FREE_COUNTER_ID, count: DEFAULT_TARGET }], adjustableTarget: true },
    {
        id: 'postPrayer',
        steps: [
            { ...SUBHANALLAH, count: 33 },
            { ...ELHAMDULILLAH, count: 33 },
            { ...ALLAHU_EKBER, count: 33 },
            { ...TEVHID_FULL, count: 1 },
        ],
    },
    { id: 'kucukTesbihat', steps: KUCUK_TESBIHAT },
    { id: 'tevhid100', steps: [{ ...TEVHID, count: 100 }], adjustableTarget: true },
    { id: 'istigfar100', steps: [{ ...ISTIGFAR, count: 100 }], adjustableTarget: true },
    { id: 'salavat100', steps: [{ ...SALAVAT, count: 100 }], adjustableTarget: true },
    { id: 'havqala100', steps: [{ ...HAVQALA, count: 100 }], adjustableTarget: true },
    { id: 'tevhid500', steps: [{ ...TEVHID, count: 500 }], adjustableTarget: true },
    { id: 'tevhid1000', steps: [{ ...TEVHID, count: 1000 }], adjustableTarget: true },
];
