import React, { useMemo } from 'react';
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
import { createStyles } from './UmrahMenuScreen.styles';

interface UmrahMenuScreenProps {
    navigation: any;
}

export const UmrahMenuScreen: React.FC<UmrahMenuScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const menuItems = [
        {
            id: 'umrah-checklist',
            title: t('umrahMenuScreen.checklistTitle'),
            description: t('umrahMenuScreen.checklistDescription'),
            icon: '✅',
            color: '#1565C0',
            onPress: () => navigation.navigate('UmrahChecklist'),
        },
        {
            id: 'umrah-progress',
            title: t('umrahMenuScreen.progressTitle'),
            description: t('umrahMenuScreen.progressDescription'),
            icon: '🕋',
            color: '#8E24AA',
            onPress: () => navigation.navigate('UmrahProgress'),
        },
        {
            id: 'dua-list',
            title: t('umrahMenuScreen.duaListTitle'),
            description: t('umrahMenuScreen.duaListDescription'),
            icon: '🤲',
            color: '#558B2F',
            onPress: () => navigation.navigate('DuaList'),
        },
        {
            id: 'umrah-duas',
            title: t('umrahMenuScreen.duasTitle'),
            description: t('umrahMenuScreen.duasDescription'),
            icon: '📿',
            color: '#C2185B',
            onPress: () => navigation.navigate('UmrahDuas'),
        },
    ];

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={t('screenTitles.umrahMenu')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {t('umrahMenuScreen.header')}
                    </Text>
                </View>

                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={item.onPress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                            <Text style={styles.icon}>{item.icon}</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>
                                {item.title}
                            </Text>
                            <Text style={styles.description}>
                                {item.description}
                            </Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <Text style={styles.arrow}>›</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {t('umrahMenuScreen.footer')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
