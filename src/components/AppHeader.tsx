import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageSelector, HeaderNavButtons } from '@msarinc/ui';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './AppHeader.styles';

const THEME_TOGGLE_LABELS = {
    light: 'Aydınlık',
    dark: 'Karanlık',
    lightsOut: 'Işıklar Kapalı',
    accessibilityLabel: (current: string, next: string) => `Tema: ${current}. Değiştirmek için dokun, sıradaki: ${next}`,
};

const LANGUAGES = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
];

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    large?: boolean;
    showBackButton?: boolean;
    onBackPress?: () => void;
    showHomeButton?: boolean;
    onHomePress?: () => void;
    autoplayToggle?: React.ReactNode;
    children?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    title,
    subtitle,
    large = false,
    showBackButton = false,
    onBackPress,
    showHomeButton = false,
    onHomePress,
    autoplayToggle,
    children,
}) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme, large, !!subtitle), [theme, large, subtitle]);

    return (
        <View style={styles.header}>
            {/* Left Buttons: Back & Home */}
            {(showBackButton || showHomeButton) && (
                <View style={styles.leftButton}>
                    <HeaderNavButtons
                        showBack={showBackButton}
                        onBackPress={onBackPress}
                        showHome={showHomeButton}
                        onHomePress={onHomePress}
                        labels={{
                            back: t('header.backButton'),
                            home: t('header.homeButton'),
                        }}
                    />
                </View>
            )}

            {/* Right Buttons */}
            <View style={styles.rightButtons}>
                {autoplayToggle && (
                    <View style={styles.autoplayToggleWrapper}>{autoplayToggle}</View>
                )}

                <LanguageSelector
                    compact
                    value={i18n.language}
                    languages={LANGUAGES}
                    onChange={(code) => i18n.changeLanguage(code)}
                />
                <ThemeToggle compact labels={THEME_TOGGLE_LABELS} />
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                {children}
            </View>
        </View>
    );
};
