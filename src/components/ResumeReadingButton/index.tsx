import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookMarked } from 'lucide-react-native';
import { useNavigationHelpers } from '@/contexts/NavigationContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { getSurahNameByNumber } from '@/utils/surahName';
import { createStyles } from './index.styles';

const ICON_SIZE = 18;

// Floating shortcut back to the most recent entry of the last-read list; hidden until there is one
export const ResumeReadingButton: React.FC = () => {
    const { lastRead } = useUserData();
    const { goToSurahVerse } = useNavigationHelpers();
    const { theme } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { t } = useTranslation();

    const position = lastRead[0];
    if (!position) return null;

    const label = `${getSurahNameByNumber(t, position.surahNumber)} ${position.verseNumber}`;

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={() => goToSurahVerse(position.surahNumber, position.verseNumber - 1)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('resumeReading.accessibilityLabel', { place: label })}
        >
            <BookMarked size={ICON_SIZE} color={theme.headerText} />
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
};
