import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeToggle, LanguageSelector } from '@msarinc/ui';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './HeaderWithDarkModeToggle.styles';

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
  autoplayToggle,
  children,
}) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      {/* Sol taraf butonları */}
      {(showBackButton || showHomeButton) && (
        <View style={styles.leftButton}>
          <View style={styles.leftButtonRow}>
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
        <Text style={[styles.title, subtitle && styles.titleWithSubtitle]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </View>
  );
};
