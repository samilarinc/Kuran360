import React from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { Mail, GitBranch, Link } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
    LanguageSelector,
    AboutScreen as MsarincAboutScreen,
    type AboutSection,
    type AboutUpdate,
} from '@msarinc/ui';
import { useTheme } from '../contexts/ThemeContext';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';

interface AboutScreenProps {
    navigation: any;
}

const LANGUAGES = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
];

const AboutScreenContent: React.FC = () => {
    const { t, i18n } = useTranslation();

    const sections: AboutSection[] = [
        { title: t('about.projectSectionTitle'), text: t('about.projectSectionText') },
        {
            title: t('about.bugsSectionTitle'),
            text: (t('about.bugsSectionBullets', { returnObjects: true }) as string[]).map((b) => `• ${b}`).join('\n'),
        },
        {
            title: t('about.updatesSectionTitle'),
            updates: t('about.updates', { returnObjects: true }) as AboutUpdate[],
        },
    ];

    return (
        <>
            <View style={styles.controlsRow}>
                <LanguageSelector
                    value={i18n.language}
                    languages={LANGUAGES}
                    onChange={(code) => i18n.changeLanguage(code)}
                />
            </View>
            <MsarincAboutScreen
                profile={{
                    avatar: require('../../public/favicon.png'),
                    name: 'Muhammed Şamil Arınç',
                    role: t('about.role'),
                    contacts: [
                        { icon: Mail, label: 'msamilarinc@gmail.com', url: 'mailto:msamilarinc@gmail.com' },
                        { icon: GitBranch, label: 'github.com/samilarinc', url: 'https://github.com/samilarinc' },
                        { icon: Link, label: 'linkedin.com/in/samil-arinc', url: 'https://www.linkedin.com/in/samil-arinc/' },
                    ],
                }}
                sections={sections}
            />
        </>
    );
};

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <HeaderWithDarkModeToggle
                title="Hakkında"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />
            <AboutScreenContent />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingTop: 12,
    },
});
