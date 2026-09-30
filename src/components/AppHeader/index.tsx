import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageSelector, HeaderNavButtons, FontSizeToggle, HeaderMenu } from '@msarinc/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { HeaderReciterButton } from '@/components/HeaderReciterButton';

const LANGUAGES = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
];

/** Below this width the right-side controls fold into a single slide-down button. */
const MENU_BREAKPOINT = 640;

/** Inside the slide-down menu the controls stack vertically, so switch known ones to their narrow forms. */
const toMenuForm = (node: React.ReactNode, menuProps: Record<string, unknown>, type: React.ElementType) =>
    React.isValidElement(node) && node.type === type ? React.cloneElement(node, menuProps) : node;

interface AppHeaderProps {
    title?: string;
    subtitle?: string;
    large?: boolean;
    showBackButton?: boolean;
    onBackPress?: () => void;
    showHomeButton?: boolean;
    onHomePress?: () => void;
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
    fontSizeToggle,
    children,
}) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme, large, !!subtitle), [theme, large, subtitle]);
    const themeToggleLabels = {
        light: t('themeToggle.light'),
        dark: t('themeToggle.dark'),
        lightsOut: t('themeToggle.lightsOut'),
        accessibilityLabel: (current: string, next: string) => t('themeToggle.accessibilityLabel', { current, next }),
    };
    const { width } = useWindowDimensions();
    const useMenu = width < MENU_BREAKPOINT;

    const fontSizeControl = useMenu ? toMenuForm(fontSizeToggle, { vertical: true }, FontSizeToggle) : fontSizeToggle;

    const controls = (
        <>
            {fontSizeControl}
            <HeaderReciterButton />
            <LanguageSelector
                compact
                value={i18n.language}
                languages={LANGUAGES}
                onChange={(code: string) => i18n.changeLanguage(code)}
            />
            <ThemeToggle compact labels={themeToggleLabels} />
        </>
    );

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
                {useMenu ? (
                    <HeaderMenu accessibilityLabel={t('header.menu')}>{controls}</HeaderMenu>
                ) : controls}
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
    contentContainer: {
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
});
