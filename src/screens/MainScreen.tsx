import React, { useMemo } from 'react';
import {
    View,
    Text,

    TouchableOpacity,
    SafeAreaView,
    Image,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';
import { Alert, Platform } from 'react-native';
import { createStyles } from './MainScreen.styles';

interface MainScreenProps {
    onNavigate: (screen: 'Home' | 'Settings' | 'Search' | 'About' | 'Profile' | 'RandomVerse' | 'Hatim' | 'PrayerTimes' | 'Hutbe' | 'UmrahMenu' | 'HijriCalendar') => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
    const { theme, isDarkMode, toggleDarkMode } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { width, height } = useWindowDimensions();

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

    const sections: { title: string; items: { id: string; title: string; icon: string; onPress: () => void }[] }[] = [
        {
            title: t('mainScreen.sections.quran'),
            items: [
                { id: 'random-verse', title: t('mainScreen.menu.randomVerse'), icon: '✨', onPress: () => onNavigate('RandomVerse') },
                { id: 'search', title: t('mainScreen.menu.search'), icon: '🔍', onPress: () => onNavigate('Search') },
                { id: 'hatim', title: t('mainScreen.menu.hatim'), icon: '☪️', onPress: () => onNavigate('Hatim') },
            ],
        },
        {
            title: t('mainScreen.sections.worship'),
            items: [
                { id: 'prayer-times', title: t('mainScreen.menu.prayerTimes'), icon: '🕌', onPress: () => onNavigate('PrayerTimes') },
                { id: 'hutbe', title: t('mainScreen.menu.hutbe'), icon: '📜', onPress: handleHutbePress },
                { id: 'umrah', title: t('mainScreen.menu.umrah'), icon: '🕋', onPress: () => onNavigate('UmrahMenu') },
                { id: 'hijri-calendar', title: t('mainScreen.menu.hijriCalendar'), icon: '🌙', onPress: () => onNavigate('HijriCalendar') },
            ],
        },
        {
            title: t('mainScreen.sections.app'),
            items: [
                { id: 'profile', title: t('mainScreen.menu.profile'), icon: '👤', onPress: () => onNavigate('Profile') },
                { id: 'settings', title: t('mainScreen.menu.settings'), icon: '⚙️', onPress: () => onNavigate('Settings') },
                { id: 'about', title: t('mainScreen.menu.about'), icon: 'ℹ️', onPress: () => onNavigate('About') },
            ],
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

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
                <Text style={[styles.welcomeText, { color: theme.text, fontSize: welcomeFontSize }]}>
                    {t('mainScreen.welcome')}
                </Text>
                <Text style={[styles.descriptionText, { color: theme.textSecondary, fontSize: descriptionFontSize, lineHeight: descriptionFontSize * 1.4 }]}>
                    {t('mainScreen.description')}
                </Text>

                {/* Featured action */}
                <TouchableOpacity
                    style={[styles.heroCard, { backgroundColor: theme.primary }]}
                    onPress={() => onNavigate('Home')}
                    activeOpacity={0.85}
                >
                    <View style={styles.heroIconWrap}>
                        <Text style={styles.heroIcon}>📖</Text>
                    </View>
                    <View style={styles.heroTextWrap}>
                        <Text style={styles.heroTitle}>{t('mainScreen.menu.surahs')}</Text>
                        <Text style={styles.heroSubtitle}>{t('mainScreen.heroSubtitle')}</Text>
                    </View>
                    <Text style={styles.heroChevron}>›</Text>
                </TouchableOpacity>

                {/* Menu Sections */}
                {sections.map((section) => (
                    <View key={section.title} style={styles.sectionBlock}>
                        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                            {section.title}
                        </Text>
                        <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            {section.items.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.menuRow,
                                        index < section.items.length - 1 && [styles.menuRowDivider, { borderBottomColor: theme.border }],
                                    ]}
                                    onPress={item.onPress}
                                    activeOpacity={0.6}
                                >
                                    <View style={[styles.rowIconWrap, { backgroundColor: theme.primary + '15' }]}>
                                        <Text style={styles.rowIcon}>{item.icon}</Text>
                                    </View>
                                    <Text style={[styles.rowTitle, { color: theme.text }]}>
                                        {item.title}
                                    </Text>
                                    <Text style={[styles.rowChevron, { color: theme.textSecondary }]}>›</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                        {t('mainScreen.footerQuote')}
                    </Text>
                    <Text style={[styles.footerReference, { color: theme.textSecondary }]}>
                        {t('mainScreen.footerReference')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};


