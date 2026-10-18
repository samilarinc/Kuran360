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

const ESMA = [
    'Cemîl', 'Karîb', 'Mucîb', 'Habîb', 'Raûf', 'Atûf', 'Ma\'ruf', 'Lâtîf', 'Azîm', 'Hannân', 'Mennân',
    'Deyyân', 'Subhân', 'Emân', 'Burhân', 'Sultân', 'Müsteân', 'Muhsin', 'Müteâl', 'Rahmân', 'Rahîm', 'Kerîm',
    'Mecîd', 'Ferd', 'Vitr', 'Ehad', 'Samed', 'Mahmûd', 'Sâdıka\'l-Va\'d', 'Aliyy', 'Ğaniyy', 'Şâfî', 'Kâfî',
    'Muâfî', 'Bâkî', 'Hâdî', 'Kâdir', 'Sâtir', 'Kahhâr', 'Cebbâr', 'Ğaffâr', 'Fettâh',
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
        transliteration: 'Allâhümme salli alâ Seyyidinâ Muhammedin ve alâ âli Seyyidinâ Muhammed Salâten tüncînâ bihâ min-cemî\'l-ehvâli ve\'l-âfat ve takdîlenâ bi-hâ cemîa\'l-hâcât ve tutahhirunâ bi-hâ min-cemî\'is-seyyiât ve terfeunâ bi-hâ indeke a\'le\'d-deracât ve tubelliğunâ bi-hâ aksâ\'l-ğayât min cemî\'l-hayrâti fi\'l-hayâti ve ba\'del-memât. Âmin yâ Mucîbe\'d-deavât ve\'l-hamdü lillâhi Rabbi\'l-âlemîn.',
    },
    { id: 'alaRasulina', transliteration: 'Alâ Rasûlinâ Salavât\n(Allâhümme salli alâ Seyyidinâ Muhammed)' },
    {
        id: 'tesbihatDuasi',
        transliteration: 'Subhânallâhi ve\'l-hamdü lillâhi ve lâ ilâhe illallâhü vallâhü ekber ve lâ havle ve lâ kuvvete illâ billâhi\'l-aliyyi\'l-azîm.',
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
    { id: 'faalem', transliteration: 'Fâ\'lem ennehû', count: 1 },
    { ...TEVHID, id: 'tevhidKucuk', transliteration: 'Lâ ilâhe illâllah', count: 33 },
    { id: 'muhammedurResulullah', transliteration: 'Muhammedu\'r-resûlullâhi sallâllâhu teâlâ aleyhi ve sellem.', count: 1 },
    {
        id: 'innallahe',
        transliteration: 'İnnallâhe ve melâiketehû yusallûne ale\'n-nebiy. Yâ eyyühellezîne âmenû sallû aleyhi ve sellimû teslîmâ. Lebbeyk.',
    },
    {
        id: 'kesira',
        transliteration: 'Allahümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Bi-adedi külli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim kesîrâ',
        count: 3,
    },
    {
        id: 'salliVeSellim',
        transliteration: 'Salli ve sellim yâ Rabbi alâ habîbike Muhammedin ve alâ cemîi\'l-enbiyâi ve\'l mürselîne ve alâ âli küllin ve sahbi küllin ecmaîn. Âmin ve\'l-hamdü lillâhi Rabbi\'l-âlemîn.',
    },
    {
        id: 'elfuElfi',
        transliteration: 'Elfü elfi salâtin ve elfü elfi selâmin aleyke yâ Rasûlallâh.\nElfü elfi salâtin ve elfü elfi selâmin aleyke yâ Habîballâh.\nElfü elfi salâtin ve elfü elfi selâmin aleyke yâ emîne vahyillâh.',
    },
    {
        id: 'resailiNur',
        transliteration: 'Allâhümme salli ve sellim ve bârik alâ seyyidinâ Muhammedin ve alâ âlihî ve ashâbihî bi-adedi evrakı\'l-eşcâr ve emvâci\'l-bihâr ve katarâti\'l-emtâr, vağfir lenâ verhamnâ veltuf binâ vebi üstâdinâ Saîde\'n-Nursî (radiyallâhu anh) ve vâlideynâ vebi talebeti Resâili\'n-Nûri\'s-sadıkîne yâ ilâhenâ bi-külli salâtin minhâ Eşhedü en lâ ilâhe illâllah ve eşhedü enne Muhammede\'r-Rasûlullâhi sallallâhü teâlâ aleyhi ve sellem.',
    },
    { id: 'esma', transliteration: ESMA.map(name => `Yâ ${name} yâ Allah`).join('\n') },
    {
        id: 'sonDua',
        transliteration: 'Yâ Rabbe\'s-semâvâti ve\'l-ardı, yâ ze\'l-celâli ve\'l-ikrâm. Es\'elüke bi-hakkı hâzihi\'l-esmâi küllihâ entüsalliye alâ seyyidinâ Muhammedin ve alâ âli Muhammedin, verham Muhammeden kemâ salleyte ve sellemte ve bârekte ve rahimte ve terahhamte alâ İbrâhîme ve alâ âli İbrâhîme fi\'l-âlemîn, Rabbenâ inneke hamîdü\'m-mecîd, bi-rahmetike yâ erhamerrâhimîn, ve\'l-hamdülillâhi Rabbi\'l-âlemîn.',
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
