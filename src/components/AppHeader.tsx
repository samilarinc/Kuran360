import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    showHomeButton?: boolean;
    onHomePress?: () => void;
    showSettingsButton?: boolean;
    onSettingsPress?: () => void;
    showSearchButton?: boolean;
    onSearchPress?: () => void;
    showLogo?: boolean;
    onLogoPress?: () => void;
    autoplayToggle?: React.ReactNode;
    children?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    title,
    subtitle,
    showBackButton = false,
    onBackPress,
    showHomeButton = false,
    onHomePress,
    showSettingsButton = false,
    onSettingsPress,
    showSearchButton = false,
    onSearchPress,
    showLogo = false,
    onLogoPress,
    autoplayToggle,
    children,
}) => {
    const { theme, isDarkMode, toggleDarkMode } = useTheme();
    const { width } = useWindowDimensions();

    const isMobile = width < 768;
    const headerVerticalPadding = isMobile ? SPACING.md : SPACING.lg;
    const headerTopPadding = isMobile ? SPACING.md : SPACING.lg;

    const styles = StyleSheet.create({
        header: {
            backgroundColor: theme.primary,
            paddingVertical: headerVerticalPadding,
            paddingHorizontal: SPACING.md,
            alignItems: 'center',
            position: 'relative',
        },
        title: {
            fontSize: FONT_SIZES.xxlarge,
            fontWeight: 'bold',
            color: theme.headerText,
            marginBottom: subtitle ? 4 : 0,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: FONT_SIZES.medium,
            color: theme.headerText,
            opacity: 0.9,
            textAlign: 'center',
        },
        leftButton: {
            position: 'absolute',
            left: SPACING.md,
            top: headerTopPadding,
            zIndex: 1,
        },
        rightButtons: {
            position: 'absolute',
            right: SPACING.md,
            top: headerTopPadding,
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
        logoContainer: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 16,
            padding: 6,
            minWidth: 32,
            alignItems: 'center',
        },
        logoImage: {
            width: 28,
            height: 28,
            borderRadius: 14,
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

            {/* Logo (Left) - Only when no back/home buttons */}
            {showLogo && onLogoPress && !showBackButton && !showHomeButton && (
                <TouchableOpacity style={styles.leftButton} onPress={onLogoPress}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../public/favicon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                </TouchableOpacity>
            )}

            {/* Right Buttons */}
            <View style={styles.rightButtons}>
                {/* Logo (Right) - When back/home buttons are present */}
                {showLogo && onLogoPress && (showBackButton || showHomeButton) && (
                    <TouchableOpacity style={[styles.actionButton, { marginRight: SPACING.xs }]} onPress={onLogoPress}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../public/favicon.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                    </TouchableOpacity>
                )}

                {autoplayToggle && (
                    <View style={{ marginRight: SPACING.xs }}>{autoplayToggle}</View>
                )}

                {showSearchButton && onSearchPress && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onSearchPress}
                    >
                        <Text style={styles.actionButtonText}>🔍</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={toggleDarkMode}
                    accessibilityLabel={isDarkMode ? "Açık mod" : "Koyu mod"}
                >
                    <Text style={styles.actionButtonText}>
                        {isDarkMode ? '☀️' : '🌙'}
                    </Text>
                </TouchableOpacity>

                {showSettingsButton && onSettingsPress && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onSettingsPress}
                    >
                        <Text style={styles.actionButtonText}>⚙️</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                {children}
            </View>
        </View>
    );
};
