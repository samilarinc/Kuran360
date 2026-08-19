import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageSelector } from '@msarinc/ui';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

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

interface HeaderWithDarkModeToggleProps {
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

export const HeaderWithDarkModeToggle: React.FC<HeaderWithDarkModeToggleProps> = ({
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
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  const styles = StyleSheet.create({
    header: {
      backgroundColor: theme.primary,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      alignItems: 'center',
      position: 'relative',
      minHeight: 48,
      justifyContent: 'center',
    },
    title: {
      fontSize: FONT_SIZES.large,
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
    backButton: {
      paddingVertical: 8,
      paddingHorizontal: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      minWidth: 32,
      alignItems: 'center',
    },
    backButtonText: {
      color: theme.headerText,
      fontSize: 18,
      fontWeight: '600',
    },
    homeButton: {
      padding: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      minWidth: 32,
      alignItems: 'center',
      marginLeft: SPACING.xs,
    },
    homeButtonText: {
      fontSize: 16,
    },
    darkModeToggle: {
      padding: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      minWidth: 32,
      alignItems: 'center',
    },
    darkModeIcon: {
      fontSize: 16,
    },
    settingsButton: {
      padding: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      minWidth: 32,
      alignItems: 'center',
    },
    settingsButtonText: {
      fontSize: 16,
    },
    searchButton: {
      padding: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      minWidth: 32,
      alignItems: 'center',
      marginRight: SPACING.xs,
    },
    searchButtonText: {
      fontSize: 16,
    },
    contentContainer: {
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
    },
    logoContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      padding: 6,
      minWidth: 32,
      alignItems: 'center',
    },
    logoText: {
      fontSize: 16,
    },
    logoImage: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    logoButton: {
      padding: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      minWidth: 32,
      alignItems: 'center',
      marginRight: SPACING.xs,
    },
  });

  return (
    <View style={styles.header}>
      {/* Sol taraf butonları */}
      {(showBackButton || showHomeButton) && (
        <View style={styles.leftButton}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showBackButton && onBackPress && (
              <TouchableOpacity onPress={onBackPress}>
                <View style={styles.backButton}>
                  <Text style={styles.backButtonText}>←</Text>
                </View>
              </TouchableOpacity>
            )}
            {showHomeButton && onHomePress && (
              <TouchableOpacity onPress={onHomePress}>
                <View style={styles.homeButton}>
                  <Text style={styles.homeButtonText}>🏠</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Logo - sadece geri ve home tuşu yokken göster */}
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

      <View style={styles.rightButtons}>
        {/* Logo sağ üstte - geri veya home tuşu varken */}
        {showLogo && onLogoPress && (showBackButton || showHomeButton) && (
          <TouchableOpacity style={styles.logoButton} onPress={onLogoPress}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../public/favicon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        )}
        {/* Autoplay toggle always first, then search, then dark mode, then settings */}
        {autoplayToggle && (
          <View style={{ marginRight: SPACING.xs }}>{autoplayToggle}</View>
        )}
        {showSearchButton && onSearchPress && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearchPress}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        )}
        <LanguageSelector
          compact
          value={i18n.language}
          languages={LANGUAGES}
          onChange={(code) => i18n.changeLanguage(code)}
        />
        <ThemeToggle compact labels={THEME_TOGGLE_LABELS} />
        {showSettingsButton && onSettingsPress && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onSettingsPress}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
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
