import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListChecks, Navigation, Navigation2, HandHeart, BookHeart } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MenuListRow } from '@/components/MenuListRow';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

interface UmrahMenuScreenProps {
    navigation: any;
}

export const UmrahMenuScreen: React.FC<UmrahMenuScreenProps> = ({ navigation }) => {
    const { common } = useTheme();
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
            id: 'qibla',
            title: t('umrahMenuScreen.qiblaTitle'),
            description: t('umrahMenuScreen.qiblaDescription'),
            Icon: Navigation2,
            color: '#0891B2',
            onPress: () => navigation.navigate('Qibla'),
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

    const styles = useThemedStyles(createStyles);

    return (
        <SafeAreaView style={common.container}>
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

const createStyles = (theme: Theme) => {
    return StyleSheet.create({
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
        color: theme.text,
    },
    });
};
