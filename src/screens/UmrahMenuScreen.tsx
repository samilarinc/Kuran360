import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';

interface UmrahMenuScreenProps {
    navigation: any;
}

export const UmrahMenuScreen: React.FC<UmrahMenuScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();

    const menuItems = [
        {
            id: 'umrah-checklist',
            title: 'Hazırlık Listesi',
            description: 'Umre öncesi yapılacaklar',
            icon: '✅',
            color: '#1565C0',
            onPress: () => navigation.navigate('UmrahChecklist'),
        },
        {
            id: 'umrah-progress',
            title: 'Şu an neredeyim?',
            description: 'Tavaf ve Sa\'y takibi yapın',
            icon: '🕋',
            color: '#8E24AA',
            onPress: () => navigation.navigate('UmrahProgress'),
        },
        {
            id: 'dua-list',
            title: 'Dua Listem',
            description: 'Kişisel dua çizelgesi oluşturun',
            icon: '🤲',
            color: '#558B2F',
            onPress: () => navigation.navigate('DuaList'),
        },
        {
            id: 'umrah-duas',
            title: 'Umre Duaları',
            description: 'Umre ibadetinde okunacak dualar',
            icon: '📿',
            color: '#C2185B',
            onPress: () => navigation.navigate('UmrahDuas'),
        },
    ];

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title="Umre Rehberi"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        Umre İbadetiniz İçin Araçlar
                    </Text>
                </View>

                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.menuItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                        onPress={item.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                            <Text style={styles.icon}>{item.icon}</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.title, { color: theme.text }]}>
                                {item.title}
                            </Text>
                            <Text style={[styles.description, { color: theme.textSecondary }]}>
                                {item.description}
                            </Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={[styles.footer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                        🤲 Allah kabul etsin
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    header: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
    },
    headerSubtitle: {
        fontSize: FONT_SIZES.medium,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderRadius: 16,
        marginBottom: SPACING.md,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    icon: {
        fontSize: 32,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
    },
    description: {
        fontSize: FONT_SIZES.small,
    },
    arrowContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 32,
    },
    footer: {
        marginTop: SPACING.xl,
        padding: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    footerText: {
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
    },
});
