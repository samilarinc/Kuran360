import React, { useMemo } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { MenuListRow } from '../components/MenuListRow';
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
                    <MenuListRow
                        key={item.id}
                        variant="card"
                        icon={item.icon}
                        iconColor={item.color + '15'}
                        title={item.title}
                        subtitle={item.description}
                        onPress={item.onPress}
                    />
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
