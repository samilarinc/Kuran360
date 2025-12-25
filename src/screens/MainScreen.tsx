import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Image,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

interface MainScreenProps {
    onNavigate: (screen: 'Home' | 'Settings' | 'Search' | 'About' | 'Profile' | 'RandomVerse' | 'Hatim') => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate }) => {
    const { theme, isDarkMode, toggleDarkMode } = useTheme();
    const { width, height } = useWindowDimensions();

    // Responsive header padding based on screen width
    const headerPaddingVertical = width < 360 ? SPACING.lg : width < 420 ? SPACING.xl : SPACING.xl * 2;
    const isUltraNarrow = width < 360;
    const isNarrow = width < 420;

    // Dynamic font sizes for small screens
    const titleFontSize = isUltraNarrow ? FONT_SIZES.large : isNarrow ? FONT_SIZES.xlarge : FONT_SIZES.xlarge;
    const subtitleFontSize = isUltraNarrow ? FONT_SIZES.small : FONT_SIZES.medium;
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
            id: 'about',
            title: 'Hakkında',
            subtitle: 'Uygulama hakkında',
            icon: 'ℹ️',
            color: '#00897B',
            onPress: () => onNavigate('About'),
        },
        {
            id: 'hatim',
            title: 'Hatimler',
            subtitle: 'Hatim gruplarına katılın',
            icon: '☪️',
            color: '#00695C',
            onPress: () => onNavigate('Hatim'),
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header with Logo */}
            <View style={[styles.header, { backgroundColor: theme.primary, paddingVertical: headerPaddingVertical }]}>
                {/* Dark mode toggle - top right */}
                <TouchableOpacity
                    style={styles.darkModeToggle}
                    onPress={toggleDarkMode}
                    accessibilityLabel={isDarkMode ? 'Açık mod' : 'Koyu mod'}
                >
                    <Text style={styles.darkModeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    {/* Logo placeholder - favicon kullanıyoruz */}
                    <View
                        style={[
                            styles.logoPlaceholder,
                            { backgroundColor: theme.surface },
                            (height < 680 || width < 360) ? { width: 64, height: 64, borderRadius: 32 } : null,
                        ]}
                    >
                        <Image
                            source={require('../../public/favicon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.appTitle, { color: theme.headerText, fontSize: titleFontSize }]}>
                        Kuran-ı Kerim
                    </Text>
                    <Text style={[styles.appSubtitle, { color: theme.headerText, fontSize: subtitleFontSize }]}>
                        Dijital Mushaf
                    </Text>
                </View>
            </View>

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

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.menuItem,
                                {
                                    backgroundColor: theme.cardBackground,
                                    borderColor: theme.border,
                                    marginTop: index > 0 ? SPACING.md : 0,
                                }
                            ]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuItemContent}>
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
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
                                <View style={[styles.arrowContainer, { borderColor: theme.border }]}>
                                    <Text style={[styles.arrow, { color: theme.textSecondary }]}>
                                        ›
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        position: 'relative',
    },
    darkModeToggle: {
        position: 'absolute',
        right: SPACING.md,
        top: SPACING.lg,
        padding: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        minWidth: 32,
        alignItems: 'center',
        zIndex: 1,
    },
    darkModeIcon: {
        fontSize: 16,
        color: '#fff',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logoText: {
        fontSize: 30,
        marginBottom: -5,
    },
    logoTextArabic: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'serif',
    },
    logoImage: {
        width: 50,
        height: 50,
    },
    appTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '700',
        marginBottom: SPACING.xs,
    },
    appSubtitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '400',
        opacity: 0.9,
    },
    contentContainer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xl,
    },
    welcomeText: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    descriptionText: {
        fontSize: FONT_SIZES.medium,
        textAlign: 'center',
        lineHeight: FONT_SIZES.medium * 1.4,
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.md,
    },
    menuContainer: {
        paddingVertical: SPACING.md,
    },
    menuItem: {
        borderRadius: 16,
        padding: SPACING.lg,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuIcon: {
        fontSize: 24,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    menuSubtitle: {
        fontSize: FONT_SIZES.medium,
        lineHeight: FONT_SIZES.medium * 1.3,
    },
    arrowContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.lg,
    },
    footerText: {
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    footerReference: {
        fontSize: FONT_SIZES.small,
        textAlign: 'center',
    },
});
