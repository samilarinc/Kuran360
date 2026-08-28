import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './UmrahDuasScreen.styles';

interface UmrahDuasScreenProps {
    onNavigate: () => void;
}

interface DuaCategory {
    id: string;
    title: string;
    duas: {
        id: string;
        title: string;
        arabic: string;
        turkish: string;
        transliteration: string;
    }[];
}

// Authentic umrah prayers from Islamic sources
const UMRAH_DUAS: DuaCategory[] = [
    {
        id: 'ihram',
        title: 'İhram',
        duas: [
            {
                id: 'ihram-1',
                title: 'Telbiye Duası (Tam Hali)',
                arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
                turkish: 'Buyruğuna amadeyim Allah\'ım, buyruğuna amadeyim. Buyruğuna amadeyim, senin hiçbir ortağın yoktur, buyruğuna amadeyim. Şüphesiz hamd sana, nimet sana, mülk sanadır. Senin hiçbir ortağın yoktur.',
                transliteration: 'Lebbeyk Allâhumme lebbeyk, lebbeyk lâ şerîke leke lebbeyk, inne\'l-hamde ve\'n-ni\'mete leke ve\'l-mülk, lâ şerîke lek',
            },
            {
                id: 'ihram-2',
                title: 'İhrama Girerken Niyet',
                arabic: 'اللَّهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي',
                turkish: 'Allah\'ım! Ben umre yapmak istiyorum, onu bana kolaylaştır ve benden kabul buyur.',
                transliteration: 'Allâhumme innî urîdu\'l-umrete fe yessir-hâ lî ve tekabbel-hâ minnî',
            },
            {
                id: 'ihram-3',
                title: 'İhramdan Çıkarken',
                arabic: 'الْحَمْدُ لِلَّهِ الَّذِي قَضَى عَنِّي نُسُكِي',
                turkish: 'İbadetimi tamamlamamı nasip eden Allah\'a hamd olsun.',
                transliteration: 'Elhamdü lillâhillezî kadâ annî nusukî',
            },
        ],
    },
    {
        id: 'tawaf',
        title: 'Tavaf',
        duas: [
            {
                id: 'tawaf-1',
                title: 'Tavafa Başlarken',
                arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ اللَّهُمَّ إِيمَانًا بِكَ وَتَصْدِيقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ',
                turkish: 'Allah\'ın adıyla, Allah en büyüktür. Allah\'ım! Sana iman ederek, kitabını tasdik ederek, ahdine vefa göstererek ve Peygamberin Muhammed\'in (s.a.v) sünnetine uyarak (tavaf ediyorum).',
                transliteration: 'Bismillâhi vallâhu ekber, Allâhumme îmânen bike ve tasdîkan bi kitâbike ve vefâen bi ahdike vettibâan li sünneti nebiyyike Muhammedin sallallâhu aleyhi ve sellem',
            },
            {
                id: 'tawaf-2',
                title: 'Hacer-i Esved\'i Selamlarken',
                arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
                turkish: 'Allah\'ın adıyla, Allah en büyüktür.',
                transliteration: 'Bismillâhi vallâhu ekber',
            },
            {
                id: 'tawaf-3',
                title: 'Rükn-ü Yemani ile Hacer-i Esved Arası',
                arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
                turkish: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver. Bizi ateş azabından koru.',
                transliteration: 'Rabbenâ âtinâ fi\'d-dunyâ haseneten ve fi\'l-âhirati haseneten ve kınâ azâben-nâr',
            },
            {
                id: 'tawaf-4',
                title: 'Tavaf Sırasında Okunabilecek Dua',
                arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
                turkish: 'Allah\'ı tesbih ederim, Allah\'a hamd ederim, Allah\'tan başka ilah yoktur, Allah en büyüktür, güç ve kuvvet ancak Allah\'tandır.',
                transliteration: 'Subhânallâhi velhamdülillâhi ve lâ ilâhe illallâhu vallâhu ekber ve lâ havle ve lâ kuvvete illâ billâh',
            },
            {
                id: 'tawaf-5',
                title: 'Tavafı Tamamlarken',
                arabic: 'اللَّهُمَّ تَقَبَّلْ مِنِّي وَأَعِنِّي عَلَى طَاعَتِكَ',
                turkish: 'Allah\'ım! Benden kabul et ve beni itaatine yardımcı ol.',
                transliteration: 'Allâhumme tekabbel minnî ve a\'innî alâ tâatik',
            },
        ],
    },
    {
        id: 'say',
        title: 'Sa\'y',
        duas: [
            {
                id: 'say-1',
                title: 'Sa\'ya Başlarken (Safa\'ya Çıkarken)',
                arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ فَمَنْ حَجَّ الْبَيْتَ أَوِ اعْتَمَرَ فَلَا جُنَاحَ عَلَيْهِ أَنْ يَطَّوَّفَ بِهِمَا',
                turkish: 'Şüphesiz Safa ile Merve, Allah\'ın (dininin) nişanelerindendir. Kim Beytullah\'ı hacceder veya umre yaparsa, onların etrafında sa\'y etmesinde bir sakınca yoktur.',
                transliteration: 'İnnes-Safâ vel-Mervete min şeâirillâh, fe men haccel-beyte evi\'temere fe lâ cunâhe aleyhi en yettavvefe bihimâ',
            },
            {
                id: 'say-2',
                title: 'Safa ve Merve Üzerinde (3 kez)',
                arabic: 'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
                turkish: 'Allah en büyüktür, Allah en büyüktür, Allah en büyüktür. Hamd Allah\'a mahsustur. Allah\'tan başka ilah yoktur. O tektir, ortağı yoktur. Mülk O\'nundur, hamd O\'na mahsustur. O diriltir ve öldürür. O her şeye kadirdir.',
                transliteration: 'Allâhu ekber Allâhu ekber Allâhu ekber ve lillâhi\'l-hamd, lâ ilâhe illallâhu vahdehû lâ şerîke leh, lehu\'l-mülkü ve lehu\'l-hamdü yuhyî ve yumîtü ve hüve alâ külli şey\'in kadîr',
            },
            {
                id: 'say-3',
                title: 'Sa\'y Sırasında',
                arabic: 'رَبِّ اغْفِرْ وَارْحَمْ إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ',
                turkish: 'Rabbim! Mağfiret et, merhamet et. Şüphesiz sen en aziz, en kerimsin.',
                transliteration: 'Rabbi\'ğfir verham inneke ente\'l-a\'azzü\'l-ekrem',
            },
            {
                id: 'say-4',
                title: 'Yeşil Direkler Arasında',
                arabic: 'رَبِّ اغْفِرْ وَارْحَمْ وَتَجَاوَزْ عَمَّا تَعْلَمُ إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ',
                turkish: 'Rabbim! Mağfiret et, merhamet et ve bildiğin günahlarımı affet. Şüphesiz sen en aziz, en kerimsin.',
                transliteration: 'Rabbi\'ğfir verham ve tecâvez ammâ ta\'lem inneke ente\'l-a\'azzü\'l-ekrem',
            },
        ],
    },
    {
        id: 'harem',
        title: 'Mescid-i Haram',
        duas: [
            {
                id: 'harem-1',
                title: 'Mescid-i Haram\'a Girerken',
                arabic: 'أَعُوذُ بِاللَّهِ الْعَظِيمِ وَبِوَجْهِهِ الْكَرِيمِ وَسُلْطَانِهِ الْقَدِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ بِسْمِ اللَّهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
                turkish: 'Azamet sahibi Allah\'a, O\'nun kerim yüzüne ve kad im sultanlığına, kovulmuş şeytandan sığınırım. Allah\'ın adıyla, salat ve selam Resulullah\'a olsun. Allah\'ım! Rahmet kapılarını bana aç.',
                transliteration: 'Eûzü billâhi\'l-azîm ve bi vechihil-kerîm ve sultânihil-kadîm mineş-şeytânir-racîm, bismillâhi vessalâtü vesselâmü alâ Resûlillâh, Allâhumme\'ftah lî ebvâbe rahmetik',
            },
            {
                id: 'harem-2',
                title: 'Kabe\'yi İlk Görünce',
                arabic: 'اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفًا وَتَعْظِيمًا وَتَكْرِيمًا وَمَهَابَةً وَزِدْ مَنْ شَرَّفَهُ وَكَرَّمَهُ مِمَّنْ حَجَّهُ أَوِ اعْتَمَرَهُ تَشْرِيفًا وَتَكْرِيمًا وَتَعْظِيمًا وَبِرًّا',
                turkish: 'Allah\'ım! Bu evi şeref, büyüklük, ikram ve heybet bakımından arttır. Onu haccedip veya umre yaparak şereflendiren ve ikram edenleri de şeref, ikram, azamet ve iyilik bakımından arttır.',
                transliteration: 'Allâhumme zid hâzel-beyte teşrîfen ve ta\'zîmen ve tekrîmen ve mehâbeten ve zid men şerrefehû ve kerremehû mimmen haccehû evi\'temerahu teşrîfen ve tekrîmen ve ta\'zîmen ve birren',
            },
            {
                id: 'harem-3',
                title: 'Mescid-i Haram\'dan Çıkarken',
                arabic: 'بِسْمِ اللَّهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
                turkish: 'Allah\'ın adıyla, salat ve selam Resulullah\'a olsun. Allah\'ım! Senden fazlını istiyorum.',
                transliteration: 'Bismillâhi vessalâtü vesselâmü alâ Resûlillâh, Allâhumme innî es\'elüke min fadlik',
            },
        ],
    },
    {
        id: 'dua-makam',
        title: 'Makam-ı İbrahim',
        duas: [
            {
                id: 'makam-1',
                title: 'Makam-ı İbrahim\'de Namaz Sonrası',
                arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
                turkish: 'Rabbim! Beni ve soyumdan gelenleri namaz kılanlardan eyle. Rabbimiz, duamı kabul et. Rabbimiz! Hesabın görüleceği gün beni, ana-babamı ve müminleri bağışla.',
                transliteration: 'Rabbi\'c-alnî mukîmes-salâti ve min zurriyyetî rabbenâ ve tekabbel duâ, rabbenağfir lî ve li vâlideyye ve lil-mü\'minîne yevme yekûmul-hisâb',
            },
        ],
    },
    {
        id: 'zemzem',
        title: 'Zemzem',
        duas: [
            {
                id: 'zemzem-1',
                title: 'Zemzem İçerken',
                arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ',
                turkish: 'Allah\'ım! Senden faydalı ilim, bol rızık ve her türlü hastalıktan şifa istiyorum.',
                transliteration: 'Allâhumme innî es\'eluke ılmen nâfi\'an ve rizkan vâsi\'an ve şifâen min kulli dâ',
            },
        ],
    },
    {
        id: 'multezem',
        title: 'Mültezem',
        duas: [
            {
                id: 'multezem-1',
                title: 'Mültezem\'de',
                arabic: 'اللَّهُمَّ إِنِّي عَبْدُكَ وَابْنُ عَبْدِكَ وَابْنُ أَمَتِكَ حَمَلْتَنِي عَلَى مَا سَخَّرْتَ لِي مِنْ خَلْقِكَ وَسَيَّرْتَنِي فِي بِلَادِكَ حَتَّى بَلَّغْتَنِي بِنِعْمَتِكَ إِلَى بَيْتِكَ',
                turkish: 'Allah\'ım! Ben senin kulunum, kulunun ve câriyenin oğluyum. Beni yarattıklarından emrine verdiğin (binek)in üzerine bindirdin ve memleketlerinde yürüttün. Sonunda nimetinle beni evine ulaştırdın.',
                transliteration: 'Allâhumme innî abduke vebnu abdike vebnu emetike hamelteni alâ mâ sehharte lî min halkıke ve seyyerteni fî bilâdike hattâ belleğtenî bi ni\'metike ilâ beytik',
            },
        ],
    },
    {
        id: 'genel',
        title: 'Genel Dualar',
        duas: [
            {
                id: 'genel-1',
                title: 'Tevbe ve Mağfiret Duası',
                arabic: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
                turkish: 'Rabbimiz! Biz kendimize zulmettik. Eğer bizi bağışlamaz ve bize acımazsan mutlaka ziyan edenlerden oluruz.',
                transliteration: 'Rabbenâ zalemnâ enfüsenâ ve illem tağfir lenâ ve terhamnâ lenekûnenne minel-hâsirîn',
            },
            {
                id: 'genel-2',
                title: 'Kabul Duası',
                arabic: 'رَبَّنَا تَقَّبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ',
                turkish: 'Rabbimiz! Bizden kabul buyur. Şüphesiz sen işitensin, bilensin.',
                transliteration: 'Rabbenâ tekabbel minnâ inneke entes-semî\'ul-alîm',
            },
            {
                id: 'genel-3',
                title: 'Hidayet Duası',
                arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
                turkish: 'Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi eğriltme. Bize katından rahmet bağışla. Şüphesiz sen çok bağışlayansın.',
                transliteration: 'Rabbenâ lâ tüziğ kulûbenâ ba\'de iz hedeyte-nâ ve heb lenâ min ledünke rahmeten inneke ente\'l-vehhâb',
            },
            {
                id: 'genel-4',
                title: 'Ebeveyn İçin Dua',
                arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
                turkish: 'Rabbim! Onlar beni küçükken nasıl terbiye ettilerse, sen de onlara öyle merhamet et.',
                transliteration: 'Rabbi\'rhamhumâ kemâ rabbeyânî sağîrâ',
            },
            {
                id: 'genel-5',
                title: 'İman Üzere Ölme Duası',
                arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ',
                turkish: 'Rabbimiz! Üzerimize sabır yağdır ve canımızı müslüman olarak al.',
                transliteration: 'Rabbenâ efriğ aleynâ sabran ve teveffenâ müslimîn',
            },
        ],
    },
];

export const UmrahDuasScreen: React.FC<UmrahDuasScreenProps> = ({ onNavigate }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [expandedDua, setExpandedDua] = useState<string | null>(null);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    };

    const toggleDua = (duaId: string) => {
        setExpandedDua(expandedDua === duaId ? null : duaId);
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={t('screenTitles.umrahDuas')}
                showBackButton={true}
                onBackPress={onNavigate}
                showHomeButton={true}
                onHomePress={onNavigate}
            />
            <ScrollView style={styles.content}>
                {UMRAH_DUAS.map(category => (
                    <View key={category.id} style={styles.categoryContainer}>
                        <TouchableOpacity
                            style={styles.categoryHeader}
                            onPress={() => toggleCategory(category.id)}
                        >
                            <View style={styles.categoryTitleContainer}>
                                <Text style={styles.categoryTitle}>
                                    {category.title}
                                </Text>
                                <Text style={styles.categoryCount}>
                                    ({category.duas.length})
                                </Text>
                            </View>
                            <Text style={styles.expandIcon}>
                                {expandedCategory === category.id ? '▼' : '▶'}
                            </Text>
                        </TouchableOpacity>

                        {expandedCategory === category.id && (
                            <View style={styles.duasContainer}>
                                {category.duas.map(dua => (
                                    <View key={dua.id} style={styles.duaItem}>
                                        <TouchableOpacity
                                            style={styles.duaHeader}
                                            onPress={() => toggleDua(dua.id)}
                                        >
                                            <Text style={styles.duaTitle}>
                                                {dua.title}
                                            </Text>
                                            <Text style={styles.expandIcon}>
                                                {expandedDua === dua.id ? '▲' : '▼'}
                                            </Text>
                                        </TouchableOpacity>

                                        {expandedDua === dua.id && (
                                            <View style={styles.duaContent}>
                                                <View style={styles.textBlock}>
                                                    <Text style={styles.label}>
                                                        {t('umrahDuasScreen.arabicLabel')}
                                                    </Text>
                                                    <Text style={styles.arabicText}>
                                                        {dua.arabic}
                                                    </Text>
                                                </View>

                                                <View style={styles.textBlock}>
                                                    <Text style={styles.label}>
                                                        {t('umrahDuasScreen.transliterationLabel')}
                                                    </Text>
                                                    <Text style={styles.transliterationText}>
                                                        {dua.transliteration}
                                                    </Text>
                                                </View>

                                                <View style={styles.textBlock}>
                                                    <Text style={styles.label}>
                                                        {t('umrahDuasScreen.meaningLabel')}
                                                    </Text>
                                                    <Text style={styles.turkishText}>
                                                        {dua.turkish}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};
