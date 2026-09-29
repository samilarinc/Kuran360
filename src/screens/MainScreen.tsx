import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    Sparkles,
    Search,
    AudioLines,
    BookOpen,
    BookCheck,
    Landmark,
    Scroll,
    Compass,
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
import { FONT_SIZES } from '@/theme';
import { Alert, Platform } from 'react-native';
import { createStyles } from './MainScreen.styles';

interface MainScreenProps {
    onNavigate: (screen: 'Home' | 'Settings' | 'Search' | 'About' | 'Profile' | 'RandomVerse' | 'Hatim' | 'PrayerTimes' | 'Hutbe' | 'UmrahMenu' | 'HijriCalendar' | 'QuranPage' | 'VerseFinder') => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
    const { common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const { width } = useWindowDimensions();

    const isUltraNarrow = width < 360;

    const welcomeFontSize = isUltraNarrow ? FONT_SIZES.large : FONT_SIZES.xlarge;
    const descriptionFontSize = isUltraNarrow ? FONT_SIZES.small : FONT_SIZES.medium;

    const handleHutbePress = async () => {
        try {
            const baseUrl = Platform.OS === 'web' ? '' : 'https://kuran360.com';
            const response = await fetch(baseUrl + '/hutbe/hutbe.pdf', { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            // In many dev environments, a missing file returns index.html (text/html)
            if (response.ok && contentType && contentType.includes('application/pdf')) {
                onNavigate('Hutbe');
            } else {
                Alert.alert(t('mainScreen.hutbeInfoTitle'), t('mainScreen.hutbeInfoMessage'));
            }
        } catch (error) {
            // On catch, we assume something went wrong with the fetch, stay safe
            Alert.alert(t('mainScreen.hutbeErrorTitle'), t('mainScreen.hutbeErrorMessage'));
        }
    };

    const sections: { title: string; items: { id: string; title: string; Icon: LucideIcon; color: string; onPress: () => void }[] }[] = [
        {
            title: t('mainScreen.sections.quran'),
            items: [
                { id: 'random-verse', title: t('mainScreen.menu.randomVerse'), Icon: Sparkles, color: '#F59E0B', onPress: () => onNavigate('RandomVerse') },
                { id: 'search', title: t('mainScreen.menu.search'), Icon: Search, color: '#3B82F6', onPress: () => onNavigate('Search') },
                // Speech recognition runs in the browser (WebGPU/WASM), so the verse finder is web-only for now
                ...(Platform.OS === 'web'
                    ? [{ id: 'verse-finder', title: t('mainScreen.menu.verseFinder'), Icon: AudioLines, color: '#EC4899', onPress: () => onNavigate('VerseFinder') }]
                    : []),
                { id: 'quran-page', title: t('mainScreen.menu.quranPage'), Icon: BookOpen, color: '#10B981', onPress: () => onNavigate('QuranPage') },
                { id: 'hatim', title: t('mainScreen.menu.hatim'), Icon: BookCheck, color: '#8B5CF6', onPress: () => onNavigate('Hatim') },
            ],
        },
        {
            title: t('mainScreen.sections.worship'),
            items: [
                { id: 'prayer-times', title: t('mainScreen.menu.prayerTimes'), Icon: Landmark, color: '#14B8A6', onPress: () => onNavigate('PrayerTimes') },
                { id: 'hutbe', title: t('mainScreen.menu.hutbe'), Icon: Scroll, color: '#F97316', onPress: handleHutbePress },
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
                <Text style={[styles.welcomeText, { fontSize: welcomeFontSize }]}>
                    {t('mainScreen.welcome')}
                </Text>
                <Text style={[styles.descriptionText, { fontSize: descriptionFontSize, lineHeight: descriptionFontSize * 1.4 }]}>
                    {t('mainScreen.description')}
                </Text>

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
                        <Text style={styles.heroSubtitle}>{t('mainScreen.heroSubtitle')}</Text>
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


