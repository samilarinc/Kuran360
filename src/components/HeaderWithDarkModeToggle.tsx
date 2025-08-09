import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

interface HeaderWithDarkModeToggleProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showSettingsButton?: boolean;
  onSettingsPress?: () => void;
  showSearchButton?: boolean;
  onSearchPress?: () => void;
  autoplayToggle?: React.ReactNode;
  children?: React.ReactNode;
}

export const HeaderWithDarkModeToggle: React.FC<HeaderWithDarkModeToggleProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  showSettingsButton = false,
  onSettingsPress,
  showSearchButton = false,
  onSearchPress,
  autoplayToggle,
  children,
}) => {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();

  const styles = StyleSheet.create({
    header: {
      backgroundColor: theme.primary,
      paddingVertical: SPACING.lg,
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
      top: SPACING.lg,
      zIndex: 1,
    },
    rightButtons: {
      position: 'absolute',
      right: SPACING.md,
      top: SPACING.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      zIndex: 1,
    },
    backButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
    },
    backButtonText: {
      color: theme.headerText,
      fontSize: FONT_SIZES.medium,
      fontWeight: '600',
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
  });

  return (
    <View style={styles.header}>
      {showBackButton && onBackPress && (
        <TouchableOpacity style={styles.leftButton} onPress={onBackPress}>
          <View style={styles.backButton}>
            <Text style={styles.backButtonText}>← Geri</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.rightButtons}>
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
        <TouchableOpacity
          style={styles.darkModeToggle}
          onPress={toggleDarkMode}
          accessibilityLabel={isDarkMode ? "Açık mod" : "Koyu mod"}
        >
          <Text style={styles.darkModeIcon}>
            {isDarkMode ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
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
