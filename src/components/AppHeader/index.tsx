import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageSelector, HeaderNavButtons, FontSizeToggle, HeaderMenu } from '@msarinc/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING, Theme } from '@/theme';
import { HeaderReciterButton } from '@/components/HeaderReciterButton';
import { ReciterPickerModal } from '@/components/ReciterPickerModal';
import { HeaderIconButton } from '@/components/HeaderIconButton';
import { useBugReport } from '@/contexts/BugReportContext';
import { Bug, Settings } from 'lucide-react-native';
import { useNavigationHelpers } from '@/contexts/NavigationContext';

const LANGUAGES = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
];

/** Below this width the right-side controls fold into a single slide-down button. */
const MENU_BREAKPOINT = 640;
// Round header buttons (HeaderIconButton and the @msarinc/ui toggles) and the gap between them
const HEADER_BUTTON_SIZE = 36;
const HEADER_BUTTON_GAP = 8;

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
        system: t('themeToggle.system'),
        light: t('themeToggle.light'),
        dark: t('themeToggle.dark'),
        lightsOut: t('themeToggle.lightsOut'),
        accessibilityLabel: (current: string, next: string) => t('themeToggle.accessibilityLabel', { current, next }),
    };
    const { width } = useWindowDimensions();
    const useMenu = width < MENU_BREAKPOINT;
    const [reciterPickerVisible, setReciterPickerVisible] = useState(false);
    const { openBugReport } = useBugReport();
    const { goToSettings } = useNavigationHelpers();

    // The side buttons are absolutely positioned, so the centered title reserves the wider side's width on both sides
    const navButtonCount = (showBackButton ? 1 : 0) + (showHomeButton ? 1 : 0);
    const leftInset = navButtonCount > 0 ? navButtonCount * HEADER_BUTTON_SIZE + (navButtonCount - 1) * HEADER_BUTTON_GAP + HEADER_BUTTON_GAP : 0;
    // Folded into one menu button on narrow screens; otherwise font size (optional), reciter, language, theme, settings and bug report
    const rightButtonCount = useMenu ? 1 : (fontSizeToggle ? 6 : 5);
    const rightInset = rightButtonCount * (HEADER_BUTTON_SIZE + HEADER_BUTTON_GAP);
    const sideInset = Math.max(leftInset, rightInset);

    const fontSizeControl = useMenu ? toMenuForm(fontSizeToggle, { vertical: true }, FontSizeToggle) : fontSizeToggle;

    const controls = (
        <>
            {fontSizeControl}
            <HeaderReciterButton onPress={() => setReciterPickerVisible(true)} />
            <LanguageSelector
                compact
                value={i18n.language}
                languages={LANGUAGES}
                onChange={(code: string) => i18n.changeLanguage(code)}
            />
            <ThemeToggle compact includeSystem labels={themeToggleLabels} />
            <HeaderIconButton icon={Settings} accessibilityLabel={t('mainScreen.menu.settings')} onPress={goToSettings} />
            <HeaderIconButton icon={Bug} accessibilityLabel={t('bugReport.title')} onPress={openBugReport} />
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

            <View style={[styles.contentContainer, { marginHorizontal: sideInset }]}>
                {title && (
                    <Text style={styles.title} numberOfLines={2}>
                        {title}
                    </Text>
                )}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                {children}
            </View>

            {/* Kept outside HeaderMenu so the modal receives touches even when the controls are folded into the menu */}
            <ReciterPickerModal visible={reciterPickerVisible} onClose={() => setReciterPickerVisible(false)} />
        </View>
    );
};

const createStyles = (theme: Theme, large: boolean, hasSubtitle: boolean) => StyleSheet.create({
    header: {
        backgroundColor: theme.headerBackground,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
        paddingVertical: large ? SPACING.md : SPACING.xs,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        position: 'relative',
        minHeight: large ? 64 : 48,
        justifyContent: 'center',
    },
    title: {
        fontSize: large ? FONT_SIZES.xxlarge - 4 : FONT_SIZES.large - 2,
        lineHeight: large ? FONT_SIZES.xxlarge + 4 : FONT_SIZES.large + 2,
        fontWeight: '600',
        color: theme.headerForeground,
        marginBottom: hasSubtitle ? 2 : 0,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
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
        alignSelf: 'stretch',
    },
});
