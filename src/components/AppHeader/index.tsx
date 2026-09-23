import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageSelector, HeaderNavButtons } from '@msarinc/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';

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
    title?: string;
    subtitle?: string;
    large?: boolean;
    showBackButton?: boolean;
    onBackPress?: () => void;
    showHomeButton?: boolean;
    onHomePress?: () => void;
    autoplayToggle?: React.ReactNode;
    fontSizeToggle?: React.ReactNode;
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
    fontSizeToggle,
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
                {fontSizeToggle}

                <LanguageSelector
                    compact
                    value={i18n.language}
                    languages={LANGUAGES}
                    onChange={(code: string) => i18n.changeLanguage(code)}
                />
                <ThemeToggle compact labels={THEME_TOGGLE_LABELS} />
            </View>

            <View style={styles.contentContainer}>
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                {children}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, large: boolean, hasSubtitle: boolean) => StyleSheet.create({
    header: {
        backgroundColor: theme.primary,
        paddingVertical: large ? SPACING.md : SPACING.xs,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        position: 'relative',
        minHeight: large ? 64 : 48,
        justifyContent: 'center',
    },
    title: {
        fontSize: large ? FONT_SIZES.xxlarge : FONT_SIZES.large,
        fontWeight: 'bold',
        color: theme.headerText,
        marginBottom: hasSubtitle ? 2 : 0,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZES.small,
        color: theme.headerText,
        opacity: 0.9,
        textAlign: 'center',
    },
    leftButton: {
        position: 'absolute',
        left: SPACING.md,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 1,
    },
    rightButtons: {
        position: 'absolute',
        right: SPACING.md,
        top: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        zIndex: 1,
    },
    autoplayToggleWrapper: {
        marginRight: SPACING.xs,
    },
    contentContainer: {
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
});
