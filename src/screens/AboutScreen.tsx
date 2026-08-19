import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { Mail, GitBranch, Link } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
    AboutScreen as MsarincAboutScreen,
    type AboutSection,
    type AboutUpdate,
} from '@msarinc/ui';
import { useTheme } from '../contexts/ThemeContext';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';

interface AboutScreenProps {
    navigation: any;
}

const AboutScreenContent: React.FC = () => {
    const { t } = useTranslation();

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
});
