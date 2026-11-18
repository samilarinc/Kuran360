import React from 'react';
import { Alert, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookHeart, CircleDot, HandHeart, Landmark, Navigation2, Scroll } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MenuTileGrid, type MenuTile } from '@/components/MenuTileGrid';
import { useTheme } from '@/contexts/ThemeContext';

interface PrayerMenuScreenProps {
    navigation: any;
}

export const PrayerMenuScreen: React.FC<PrayerMenuScreenProps> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();

    const handleHutbePress = async () => {
        try {
            const baseUrl = Platform.OS === 'web' ? '' : 'https://kuran360.com';
            const response = await fetch(baseUrl + '/hutbe/hutbe.pdf', { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            // In many dev environments, a missing file returns index.html (text/html)
            if (response.ok && contentType && contentType.includes('application/pdf')) {
                navigation.navigate('Hutbe');
            } else {
                Alert.alert(t('prayerMenu.hutbeInfoTitle'), t('prayerMenu.hutbeInfoMessage'));
            }
        } catch (error) {
            // On catch, we assume something went wrong with the fetch, stay safe
            Alert.alert(t('prayerMenu.hutbeErrorTitle'), t('prayerMenu.hutbeErrorMessage'));
        }
    };

    const menuItems: MenuTile[] = [
        {
            id: 'prayer-times',
            title: t('mainScreen.menu.prayerTimes'),
            Icon: Landmark,
            color: theme.accent,
            onPress: () => navigation.navigate('PrayerTimes'),
        },
        {
            id: 'qibla',
            title: t('mainScreen.menu.qibla'),
            Icon: Navigation2,
            color: theme.accent,
            onPress: () => navigation.navigate('Qibla'),
        },
        {
            id: 'duas',
            title: t('duas.title'),
            Icon: BookHeart,
            color: theme.accent,
            onPress: () => navigation.navigate('Duas'),
        },
        {
            id: 'dua-list',
            title: t('mainScreen.menu.duaList'),
            Icon: HandHeart,
            color: theme.accent,
            onPress: () => navigation.navigate('DuaList'),
        },
        {
            id: 'zikirmatik',
            title: t('mainScreen.menu.zikirmatik'),
            Icon: CircleDot,
            color: theme.accent,
            onPress: () => navigation.navigate('Zikirmatik'),
        },
        {
            id: 'hutbe',
            title: t('mainScreen.menu.hutbe'),
            Icon: Scroll,
            color: theme.accent,
            onPress: handleHutbePress,
        },
    ];

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('prayerMenu.title')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />
            <ScrollView style={common.flex1} contentContainerStyle={common.listContent}>
                <MenuTileGrid items={menuItems} />
            </ScrollView>
        </SafeAreaView>
    );
};
