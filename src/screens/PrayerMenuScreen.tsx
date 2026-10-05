import React from 'react';
import { Alert, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HandHeart, Landmark, Navigation2, Scroll } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MenuListRow } from '@/components/MenuListRow';
import { useTheme } from '@/contexts/ThemeContext';

interface PrayerMenuScreenProps {
    navigation: any;
}

export const PrayerMenuScreen: React.FC<PrayerMenuScreenProps> = ({ navigation }) => {
    const { common } = useTheme();
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

    const menuItems = [
        {
            id: 'prayer-times',
            title: t('mainScreen.menu.prayerTimes'),
            description: t('prayerMenu.prayerTimesDescription'),
            Icon: Landmark,
            color: '#14B8A6',
            onPress: () => navigation.navigate('PrayerTimes'),
        },
        {
            id: 'qibla',
            title: t('mainScreen.menu.qibla'),
            description: t('prayerMenu.qiblaDescription'),
            Icon: Navigation2,
            color: '#0891B2',
            onPress: () => navigation.navigate('Qibla'),
        },
        {
            id: 'dua-list',
            title: t('mainScreen.menu.duaList'),
            description: t('prayerMenu.duaListDescription'),
            Icon: HandHeart,
            color: '#558B2F',
            onPress: () => navigation.navigate('DuaList'),
        },
        {
            id: 'hutbe',
            title: t('mainScreen.menu.hutbe'),
            description: t('prayerMenu.hutbeDescription'),
            Icon: Scroll,
            color: '#F97316',
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
                {menuItems.map(item => (
                    <MenuListRow
                        key={item.id}
                        variant="card"
                        icon={<item.Icon size={26} color={item.color} />}
                        iconColor={item.color + '15'}
                        title={item.title}
                        subtitle={item.description}
                        onPress={item.onPress}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};
