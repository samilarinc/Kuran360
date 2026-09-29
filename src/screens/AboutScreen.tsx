import React from 'react';
import { SafeAreaView } from 'react-native';
import { Mail, GitBranch, Link, Code } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
    AboutScreen as MsarincAboutScreen,
    type AboutSection,
    type AboutUpdate,
} from '@msarinc/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/AppHeader';

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
            title: t('about.creditsSectionTitle'),
            text: (t('about.creditsSectionBullets', { returnObjects: true }) as string[]).map((b) => `• ${b}`).join('\n'),
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
                    { icon: Mail, label: 'Email (msamilarinc@gmail.com)', url: 'mailto:msamilarinc@gmail.com' },
                    { icon: GitBranch, label: 'GitHub (samilarinc)', url: 'https://github.com/samilarinc' },
                    { icon: Code, label: t('about.sourceCode'), url: 'https://github.com/samilarinc/Kuran360' },
                    { icon: Link, label: 'LinkedIn (samil-arinc)', url: 'https://www.linkedin.com/in/samil-arinc/' },
                    { icon: Link, label: 'Website (msarinc.com.tr)', url: 'https://www.msarinc.com.tr' },
                ],
            }}
            sections={sections}
        />
    );
};

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const { common: styles } = useTheme();
    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title={t('screenTitles.about')}
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />
            <AboutScreenContent />
        </SafeAreaView>
    );
};
