import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Search } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MenuTileGrid, type MenuTile } from '@/components/MenuTileGrid';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchMenuScreenProps {
    navigation: any;
}

export const SearchMenuScreen: React.FC<SearchMenuScreenProps> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();

    const menuItems: MenuTile[] = [
        {
            id: 'classic-search',
            title: t('searchMenu.classicTitle'),
            Icon: Search,
            color: theme.iconPrimary,
            onPress: () => navigation.navigate('Search'),
        },
        {
            id: 'topic-search',
            title: t('searchMenu.topicTitle'),
            Icon: Lightbulb,
            color: theme.iconPrimary,
            onPress: () => navigation.navigate('TopicSearch'),
        },
    ];

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('searchMenu.title')}
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
