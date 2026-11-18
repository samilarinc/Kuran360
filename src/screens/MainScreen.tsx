import React, { useEffect } from 'react';
import {
    Alert,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Search,
    AudioLines,
    Landmark,
    Brain,
    BookOpen,
    BookOpenText,
    BookCheck,
    Compass,
    HandHeart,
    Moon,
    User,
    Settings,
    Info,
    ChevronRight,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { getSurahNameByNumber } from '@/utils/surahName';
import { Platform } from 'react-native';
import { QuranSpeech } from '../../modules/quran-speech';
import { isDataUpdateAvailable } from '@/data/quranData';
import { createStyles } from './MainScreen.styles';

/** Speech recognition and topic search: in the browser, or natively where modules/quran-speech is built in (Android, iOS) */
const hasSpeech = Platform.OS === 'web' || QuranSpeech !== null;
import { MenuTileGrid, type MenuTile } from '@/components/MenuTileGrid';


/** The new data prompt is shown once per app launch, not every time the main screen opens */
let dataUpdatePromptShown = false;

interface MainScreenProps {
    onNavigate: (screen: 'Home' | 'Settings' | 'Search' | 'SearchMenu' | 'About' | 'Profile' | 'RandomVerse' | 'Hatim' | 'UmrahMenu' | 'PrayerMenu' | 'HijriCalendar' | 'PrayerTimes' | 'QuranPage' | 'VerseFinder' | 'Memorization' | 'Tafsir' | 'DataManagement', params?: any) => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const { lastRead } = useUserData();
    const { goToSurahVerse } = useNavigationHelpers();
    const lastReadPosition = lastRead[0];
    const lastReadLabel = lastReadPosition
        ? `${getSurahNameByNumber(t, lastReadPosition.surahNumber)} ${lastReadPosition.verseNumber}`
        : '';
    const styles = useThemedStyles(createStyles);

    // A newer app version can bring newer data (translations, word meanings): offer to download it
    useEffect(() => {
        if (dataUpdatePromptShown) return;
        isDataUpdateAvailable().then(available => {
            if (!available || dataUpdatePromptShown) return;
            dataUpdatePromptShown = true;
            const startUpdate = () => onNavigate('DataManagement', { startDataUpdate: true });
            if (Platform.OS === 'web') {
                // Alert.alert does nothing on web
                if ((globalThis as any).confirm?.(`${t('dataUpdatePrompt.title')}\n\n${t('dataUpdatePrompt.message')}`)) startUpdate();
            } else {
                Alert.alert(t('dataUpdatePrompt.title'), t('dataUpdatePrompt.message'), [
                    { text: t('dataUpdatePrompt.later'), style: 'cancel' },
                    { text: t('dataUpdatePrompt.update'), onPress: startUpdate },
                ]);
            }
        });
    }, [onNavigate, t]);

    const sections: { title: string; items: MenuTile[] }[] = [

        {
            title: t('mainScreen.sections.quran'),
            items: [
                // Speech recognition runs in the browser (WebGPU/WASM) or natively (modules/quran-speech) on Android and iOS
                ...(hasSpeech
                    ? [{
                        id: 'verse-finder', title: t('mainScreen.menu.verseFinder'),
                        Icon: AudioLines, color: theme.iconPrimary, featured: true, onPress: () => onNavigate('VerseFinder'),
                    }]
                    : []),
                { id: 'random-verse', title: t('mainScreen.menu.randomVerse'), Icon: Sparkles, color: theme.iconPrimary, onPress: () => onNavigate('RandomVerse') },
                // Topic search runs in the browser or natively (modules/quran-speech); without it the search button opens the classic search directly
                { id: 'search', title: t('mainScreen.menu.search'), Icon: Search, color: theme.iconPrimary, onPress: () => onNavigate(hasSpeech ? 'SearchMenu' : 'Search') },
                ...(hasSpeech
                    ? [
                        { id: 'memorization', title: t('mainScreen.menu.memorization'), Icon: Brain, color: theme.iconPrimary, onPress: () => onNavigate('Memorization') },
                    ]
                    : []),
                { id: 'quran-page', title: t('mainScreen.menu.quranPage'), Icon: BookOpen, color: theme.iconPrimary, onPress: () => onNavigate('QuranPage') },
                { id: 'tafsir', title: t('mainScreen.menu.tafsir'), Icon: BookOpenText, color: theme.iconPrimary, onPress: () => onNavigate('Tafsir') },
                { id: 'hatim', title: t('mainScreen.menu.hatim'), Icon: BookCheck, color: theme.iconPrimary, onPress: () => onNavigate('Hatim') },
            ],
        },
        {
            title: t('mainScreen.sections.worship'),
            items: [
                // The most used prayer screen, also reachable inside "Prayers and duas"
                { id: 'prayer-times', title: t('mainScreen.menu.prayerTimes'), Icon: Landmark, color: theme.accent, onPress: () => onNavigate('PrayerTimes') },
                { id: 'prayers', title: t('mainScreen.menu.prayers'), Icon: HandHeart, color: theme.accent, onPress: () => onNavigate('PrayerMenu') },
                { id: 'umrah', title: t('mainScreen.menu.umrah'), Icon: Compass, color: theme.accent, onPress: () => onNavigate('UmrahMenu') },
                { id: 'hijri-calendar', title: t('mainScreen.menu.hijriCalendar'), Icon: Moon, color: theme.accent, onPress: () => onNavigate('HijriCalendar') },
            ],
        },
        {
            title: t('mainScreen.sections.app'),
            items: [
                { id: 'profile', title: t('mainScreen.menu.profile'), Icon: User, color: theme.textSecondary, onPress: () => onNavigate('Profile') },
                { id: 'settings', title: t('mainScreen.menu.settings'), Icon: Settings, color: theme.textSecondary, onPress: () => onNavigate('Settings') },
                { id: 'about', title: t('mainScreen.menu.about'), Icon: Info, color: theme.textSecondary, onPress: () => onNavigate('About') },
            ],
        },
    ];

    const gridSections = sections.slice(0, -1);
    const appSection = sections[sections.length - 1];

    return (
        <SafeAreaView style={common.container}>

            <AppHeader
                title={t('mainScreen.appTitle')}
                subtitle={t('mainScreen.appSubtitle')}
                large
            />

            {/* Main Content */}
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Featured action: the surah list, with the last-read place under the title once there is one */}
                <TouchableOpacity
                    style={styles.heroCard}
                    onPress={() => onNavigate('Home')}
                    activeOpacity={0.85}
                >
                    <View style={styles.heroIconWrap}>
                        <BookOpen size={24} color={theme.featuredIcon} />
                    </View>
                    <View style={common.flex1}>
                        <Text style={styles.heroTitle}>{t('mainScreen.menu.surahs')}</Text>
                        {lastReadPosition && (
                            // Its own touch target inside the card: tapping the place opens that verse, the rest of the card the surah list
                            <TouchableOpacity
                                style={styles.heroResume}
                                onPress={() => goToSurahVerse(lastReadPosition.surahNumber, lastReadPosition.verseNumber - 1)}
                                activeOpacity={0.6}
                                accessibilityRole="button"
                                accessibilityLabel={t('resumeReading.accessibilityLabel', { place: lastReadLabel })}
                            >
                                <Text style={styles.heroResumeLabel}>{t('mainScreen.resumeLabel')}:</Text>
                                <Text style={styles.heroResumePlace}>{lastReadLabel}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ChevronRight size={22} color={theme.featuredIcon} strokeWidth={2.5} />
                </TouchableOpacity>

                {/* Tool sections as a two-column grid: every tool one tap away without a long list */}
                {gridSections.map((section) => (
                    <View key={section.title} style={common.mbLg}>
                        <Text style={common.groupLabel}>
                            {section.title}
                        </Text>
                        <MenuTileGrid items={section.items} />
                    </View>
                ))}

                {/* Rarely used app pages: a row of small buttons instead of a section of their own */}
                <View style={styles.appLinks}>
                    {appSection.items.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.appLink}
                            onPress={item.onPress}
                            accessibilityRole="button"
                        >
                            <item.Icon size={20} color={theme.textSecondary} />
                            <Text style={styles.appLinkText}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[common.footerText, common.mbXs]}>
                        {t('mainScreen.footerQuote')}
                    </Text>
                    <Text style={[common.smallText, common.textCenter]}>
                        {t('mainScreen.footerReference')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};


