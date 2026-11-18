import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListChecks, Navigation, BookHeart } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { MenuTileGrid, type MenuTile } from '@/components/MenuTileGrid';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

interface UmrahMenuScreenProps {
    navigation: any;
}

export const UmrahMenuScreen: React.FC<UmrahMenuScreenProps> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();

    const menuItems: MenuTile[] = [
        {
            id: 'umrah-checklist',
            // Headline item, full width above the other two
            featured: true,
            title: t('umrahMenuScreen.checklistTitle'),
            Icon: ListChecks,
            color: theme.accent,
            onPress: () => navigation.navigate('UmrahChecklist'),
        },
        {
            id: 'umrah-progress',
            title: t('umrahMenuScreen.progressTitle'),
            Icon: Navigation,
            color: theme.accent,
            onPress: () => navigation.navigate('UmrahProgress'),
        },
        {
            id: 'umrah-duas',
            title: t('umrahMenuScreen.duasTitle'),
            Icon: BookHeart,
            color: theme.accent,
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

                <MenuTileGrid items={menuItems} />

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
