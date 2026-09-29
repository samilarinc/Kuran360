import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Search } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MenuListRow } from '@/components/MenuListRow';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchMenuScreenProps {
    navigation: any;
}

export const SearchMenuScreen: React.FC<SearchMenuScreenProps> = ({ navigation }) => {
    const { common } = useTheme();
    const { t } = useTranslation();

    const menuItems = [
        {
            id: 'classic-search',
            title: t('searchMenu.classicTitle'),
            description: t('searchMenu.classicDescription'),
            Icon: Search,
            color: '#3B82F6',
            onPress: () => navigation.navigate('Search'),
        },
        {
            id: 'topic-search',
            title: t('searchMenu.topicTitle'),
            description: t('searchMenu.topicDescription'),
            Icon: Lightbulb,
            color: '#06B6D4',
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
            <ScrollView style={common.contentLarge} contentContainerStyle={common.listContent}>
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
