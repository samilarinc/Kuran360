import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageSelector } from '@msarinc/ui';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';

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
    const { i18n } = useTranslation();

    const styles = StyleSheet.create({
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
            marginBottom: subtitle ? 2 : 0,
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
        actionButton: {
            padding: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 16,
            minWidth: 32,
            alignItems: 'center',
            justifyContent: 'center',
        },
        actionButtonText: {
            fontSize: 16,
            color: theme.headerText,
        },
        backButton: {
            paddingVertical: 8,
            paddingHorizontal: 8,
        },
        backButtonText: {
            fontSize: 18,
            fontWeight: '600',
        },
        contentContainer: {
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
        },
    });

    return (
        <View style={styles.header}>
            {/* Left Buttons: Back & Home */}
            {(showBackButton || showHomeButton) && (
                <View style={styles.leftButton}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                        {showBackButton && onBackPress && (
                            <TouchableOpacity onPress={onBackPress}>
                                <View style={[styles.actionButton, styles.backButton]}>
                                    <Text style={[styles.actionButtonText, styles.backButtonText]}>←</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        {showHomeButton && onHomePress && (
                            <TouchableOpacity onPress={onHomePress}>
                                <View style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>🏠</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Right Buttons */}
            <View style={styles.rightButtons}>
                {autoplayToggle && (
                    <View style={{ marginRight: SPACING.xs }}>{autoplayToggle}</View>
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
