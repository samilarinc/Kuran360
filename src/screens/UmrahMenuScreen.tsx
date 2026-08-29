import React, { useMemo } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListChecks, Navigation, HandHeart, BookHeart } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MenuListRow } from '@/components/MenuListRow';
import { useTheme } from '@/contexts/ThemeContext';
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
            Icon: ListChecks,
            color: '#1565C0',
            onPress: () => navigation.navigate('UmrahChecklist'),
        },
        {
            id: 'umrah-progress',
            title: t('umrahMenuScreen.progressTitle'),
            description: t('umrahMenuScreen.progressDescription'),
            Icon: Navigation,
            color: '#8E24AA',
            onPress: () => navigation.navigate('UmrahProgress'),
        },
        {
            id: 'dua-list',
            title: t('umrahMenuScreen.duaListTitle'),
            description: t('umrahMenuScreen.duaListDescription'),
            Icon: HandHeart,
            color: '#558B2F',
            onPress: () => navigation.navigate('DuaList'),
        },
        {
            id: 'umrah-duas',
            title: t('umrahMenuScreen.duasTitle'),
            description: t('umrahMenuScreen.duasDescription'),
            Icon: BookHeart,
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
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {t('umrahMenuScreen.header')}
                    </Text>
                </View>

                {menuItems.map((item) => (
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
