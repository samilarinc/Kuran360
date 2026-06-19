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
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';
import { Alert, Platform } from 'react-native';
import { createStyles } from './MainScreen.styles';

interface MainScreenProps {
    onNavigate: (screen: 'Home' | 'Settings' | 'Search' | 'About' | 'Profile' | 'RandomVerse' | 'Hatim' | 'PrayerTimes' | 'Hutbe' | 'UmrahMenu') => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
    const { theme, isDarkMode, toggleDarkMode } = useTheme();
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
            title: 'Sureler',
            subtitle: 'Kuran-ı Kerim\'i okuyun',
            icon: '📖',
            color: '#2E7D32',
            onPress: () => onNavigate('Home'),
        },
        {
            id: 'random-verse',
            title: 'Rastgele Ayet',
            subtitle: 'Günün ayetini keşfedin',
            icon: '✨',
            color: '#FF7043',
            onPress: () => onNavigate('RandomVerse'),
        },
        {
            id: 'search',
            title: 'Arama',
            subtitle: 'Kuran\'da kelime arayın',
            icon: '🔍',
            color: '#1976D2',
            onPress: () => onNavigate('Search'),
        },
        {
            id: 'settings',
            title: 'Ayarlar',
            subtitle: 'Uygulama tercihleriniz',
            icon: '⚙️',
            color: '#6A1B9A',
            onPress: () => onNavigate('Settings'),
        },
        {
            id: 'profile',
            title: 'Profil',
            subtitle: 'Hesabınız ve ayarlarınız',
            icon: '👤',
            color: '#455A64',
            onPress: () => onNavigate('Profile'),
        },
        {
            id: 'hatim',
            title: 'Hatimler',
            subtitle: 'Hatim gruplarına katılın',
            icon: '☪️',
            color: '#00695C',
            onPress: () => onNavigate('Hatim'),
        },
        {
            id: 'prayer-times',
            title: 'Namaz Vakitleri',
            subtitle: 'Ezan saatlerini takip edin',
            icon: '🕌',
            color: '#2E7D32',
            onPress: () => onNavigate('PrayerTimes'),
        },
        {
            id: 'hutbe',
            title: 'Cuma Hutbesi',
            subtitle: 'Haftalık cuma hutbesini okuyun',
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
                        Alert.alert('Bilgi', 'Güncel hutbe henüz yüklenmedi.');
                    }
                } catch (error) {
                    // On catch, we assume something went wrong with the fetch, stay safe
                    Alert.alert('Hata', 'Hutbe dosyasına ulaşılamadı. Lütfen daha sonra tekrar deneyin.');
                }
            },
        },
        {
            id: 'umrah',
            title: 'Umre',
            subtitle: 'Umre rehberi ve takip',
            icon: '🕋',
            color: '#8E24AA',
            onPress: () => onNavigate('UmrahMenu'),
        },
        {
            id: 'about',
            title: 'Hakkında',
            subtitle: 'Uygulama hakkında',
            icon: 'ℹ️',
            color: '#00897B',
            onPress: () => onNavigate('About'),
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

            <AppHeader
                title="Kuran-ı Kerim"
                subtitle="Dijital Mushaf"
                showLogo={false} // Use standard title/subtitle centered
                showSettingsButton={true}
                onSettingsPress={() => onNavigate('Settings')}
            />

            {/* Main Content */}
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.welcomeText, { color: theme.text, fontSize: welcomeFontSize }]}>
                    Hoş Geldiniz
                </Text>
                <Text style={[styles.descriptionText, { color: theme.textSecondary, fontSize: descriptionFontSize, lineHeight: descriptionFontSize * 1.4 }]}>
                    Kuran-ı Kerim'i okumak, aramak ve dinlemek için bir seçenek belirleyin
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
                                    <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                                        {item.subtitle}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                        "Yaratan Rabbinin adıyla oku."
                    </Text>
                    <Text style={[styles.footerReference, { color: theme.textSecondary }]}>
                        (Alak Suresi, 1. Ayet)
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};


