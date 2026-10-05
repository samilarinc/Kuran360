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
    Brain,
    BookOpen,
    BookCheck,
    Compass,
    HandHeart,
    Moon,
    User,
    Settings,
    Info,
    ChevronRight,
    type LucideIcon,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MenuListRow } from '@/components/MenuListRow';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { Platform } from 'react-native';
import { isDataUpdateAvailable } from '@/data/quranData';
import { createStyles } from './MainScreen.styles';

/** The new data prompt is shown once per app launch, not every time the main screen opens */
let dataUpdatePromptShown = false;

interface MainScreenProps {
    onNavigate: (screen: 'Home' | 'Settings' | 'Search' | 'SearchMenu' | 'About' | 'Profile' | 'RandomVerse' | 'Hatim' | 'UmrahMenu' | 'PrayerMenu' | 'HijriCalendar' | 'QuranPage' | 'VerseFinder' | 'Memorization', params?: any) => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
    const { common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);

    // A newer app version can bring newer data (translations, word meanings): offer to download it
    useEffect(() => {
        if (dataUpdatePromptShown) return;
        isDataUpdateAvailable().then(available => {
            if (!available || dataUpdatePromptShown) return;
            dataUpdatePromptShown = true;
            const startUpdate = () => onNavigate('Settings', { startDataUpdate: true });
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

    const sections: { title: string; items: { id: string; title: string; Icon: LucideIcon; color: string; onPress: () => void }[] }[] = [
        {
            title: t('mainScreen.sections.quran'),
            items: [
                { id: 'random-verse', title: t('mainScreen.menu.randomVerse'), Icon: Sparkles, color: '#F59E0B', onPress: () => onNavigate('RandomVerse') },
                // Topic search is web-only, so elsewhere the search button opens the classic search directly
                { id: 'search', title: t('mainScreen.menu.search'), Icon: Search, color: '#3B82F6', onPress: () => onNavigate(Platform.OS === 'web' ? 'SearchMenu' : 'Search') },
                // Speech recognition runs in the browser (WebGPU/WASM) or natively on Android (modules/quran-speech), not on iOS yet
                ...(Platform.OS === 'web' || Platform.OS === 'android'
                    ? [
                        { id: 'verse-finder', title: t('mainScreen.menu.verseFinder'), Icon: AudioLines, color: '#EC4899', onPress: () => onNavigate('VerseFinder') },
                        { id: 'memorization', title: t('mainScreen.menu.memorization'), Icon: Brain, color: '#A855F7', onPress: () => onNavigate('Memorization') },
                    ]
                    : []),
                { id: 'quran-page', title: t('mainScreen.menu.quranPage'), Icon: BookOpen, color: '#10B981', onPress: () => onNavigate('QuranPage') },
                { id: 'hatim', title: t('mainScreen.menu.hatim'), Icon: BookCheck, color: '#8B5CF6', onPress: () => onNavigate('Hatim') },
            ],
        },
        {
            title: t('mainScreen.sections.worship'),
            items: [
                { id: 'prayers', title: t('mainScreen.menu.prayers'), Icon: HandHeart, color: '#14B8A6', onPress: () => onNavigate('PrayerMenu') },
                { id: 'umrah', title: t('mainScreen.menu.umrah'), Icon: Compass, color: '#F43F5E', onPress: () => onNavigate('UmrahMenu') },
                { id: 'hijri-calendar', title: t('mainScreen.menu.hijriCalendar'), Icon: Moon, color: '#6366F1', onPress: () => onNavigate('HijriCalendar') },
            ],
        },
        {
            title: t('mainScreen.sections.app'),
            items: [
                { id: 'profile', title: t('mainScreen.menu.profile'), Icon: User, color: '#0EA5E9', onPress: () => onNavigate('Profile') },
                { id: 'settings', title: t('mainScreen.menu.settings'), Icon: Settings, color: '#64748B', onPress: () => onNavigate('Settings') },
                { id: 'about', title: t('mainScreen.menu.about'), Icon: Info, color: '#22C55E', onPress: () => onNavigate('About') },
            ],
        },
    ];

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
                {/* Featured action */}
                <TouchableOpacity
                    style={styles.heroCard}
                    onPress={() => onNavigate('Home')}
                    activeOpacity={0.85}
                >
                    <View style={styles.heroIconWrap}>
                        <BookOpen size={24} color="#fff" />
                    </View>
                    <View style={common.flex1}>
                        <Text style={styles.heroTitle}>{t('mainScreen.menu.surahs')}</Text>
                    </View>
                    <View style={styles.heroChevronWrap}>
                        <ChevronRight size={20} color="#fff" strokeWidth={3} />
                    </View>
                </TouchableOpacity>

                {/* Menu Sections */}
                {sections.map((section) => (
                    <View key={section.title} style={common.mbLg}>
                        <Text style={styles.sectionHeader}>
                            {section.title}
                        </Text>
                        <View style={styles.sectionCard}>
                            {section.items.map((item, index) => (
                                <View
                                    key={item.id}
                                    style={index < section.items.length - 1 && styles.menuRowDivider}
                                >
                                    <MenuListRow
                                        variant="list"
                                        icon={<item.Icon size={20} color={item.color} />}
                                        iconColor={item.color + '1A'}
                                        title={item.title}
                                        onPress={item.onPress}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

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


