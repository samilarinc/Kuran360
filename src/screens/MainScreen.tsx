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
    const numColumns = 3;
    const horizontalPadding = SPACING.lg * 2;
    const cardWidth = Math.floor((width - horizontalPadding) / numColumns) - SPACING.sm;

    const welcomeFontSize = isUltraNarrow ? FONT_SIZES.large : FONT_SIZES.xlarge;
    const descriptionFontSize = isUltraNarrow ? FONT_SIZES.small : FONT_SIZES.medium;

    const menuItems = [
        {
            id: 'surahs',
            title: t('mainScreen.menu.surahs'),
            icon: '📖',
            color: '#2E7D32',
            onPress: () => onNavigate('Home'),
        },
        {
            id: 'random-verse',
            title: t('mainScreen.menu.randomVerse'),
            icon: '✨',
            color: '#FF7043',
            onPress: () => onNavigate('RandomVerse'),
        },
        {
            id: 'search',
            title: t('mainScreen.menu.search'),
            icon: '🔍',
            color: '#1976D2',
            onPress: () => onNavigate('Search'),
        },
        {
            id: 'settings',
            title: t('mainScreen.menu.settings'),
            icon: '⚙️',
            color: '#6A1B9A',
            onPress: () => onNavigate('Settings'),
        },
        {
            id: 'profile',
            title: t('mainScreen.menu.profile'),
            icon: '👤',
            color: '#455A64',
            onPress: () => onNavigate('Profile'),
        },
        {
            id: 'hatim',
            title: t('mainScreen.menu.hatim'),
            icon: '☪️',
            color: '#00695C',
            onPress: () => onNavigate('Hatim'),
        },
        {
            id: 'prayer-times',
            title: t('mainScreen.menu.prayerTimes'),
            icon: '🕌',
            color: '#2E7D32',
            onPress: () => onNavigate('PrayerTimes'),
        },
        {
            id: 'hutbe',
            title: t('mainScreen.menu.hutbe'),
            icon: '📜',
            color: '#D84315',
            onPress: async () => {
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
            },
        },
        {
            id: 'umrah',
            title: t('mainScreen.menu.umrah'),
            icon: '🕋',
            color: '#8E24AA',
            onPress: () => onNavigate('UmrahMenu'),
        },
        {
            id: 'hijri-calendar',
            title: t('mainScreen.menu.hijriCalendar'),
            icon: '🌙',
            color: '#1a237e',
            onPress: () => onNavigate('HijriCalendar'),
        },
        {
            id: 'about',
            title: t('mainScreen.menu.about'),
            icon: 'ℹ️',
            color: '#00897B',
            onPress: () => onNavigate('About'),
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

                {/* Menu Items Grid */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.menuItem,
                                {
                                    width: cardWidth,
                                    backgroundColor: theme.cardBackground,
                                    borderColor: theme.border,
                                }
                            ]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuItemContent}>
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                    <Text style={styles.menuIcon}>{item.icon}</Text>
                                </View>
                                <View style={styles.menuTextContainer}>
                                    <Text style={[styles.menuTitle, { color: theme.text }]}>
                                        {item.title}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

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


