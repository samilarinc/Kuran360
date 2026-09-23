import React from 'react';
import {
    View,
    Text,
} from 'react-native';
import { VerseShareData, ImageSize } from '@/types';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getVerseLabel } from '@/utils/verseRange';
import { createStyles } from './index.styles';

interface NativeVerseImageDesignProps {
    verseData: VerseShareData;
    themeMode: 'light' | 'dark';
    size: ImageSize;
    /** Bundled font-family for the Arabic text; system font when omitted. */
    arabicFontFamily?: string;
    /** A+/A- multiplier from the preview screen. */
    fontScale?: number;
}

export const NativeVerseImageDesign: React.FC<NativeVerseImageDesignProps> = ({
    verseData,
    themeMode,
    size,
    arabicFontFamily,
    fontScale = 1,
}) => {
    const { settings } = useSettings();
    const styles = useThemedStyles(createStyles);
    const isDark = themeMode === 'dark';
    const { arabicText, translation } = verseData;

    // Palette (matching VerseImageGenerator.ts)
    const palette = {
        background: isDark ? '#0F120F' : '#FAFAFA',
        text: isDark ? '#F2F5F2' : '#2C2C2C',
        translation: isDark ? '#C2C7C2' : '#666666',
        accent: isDark ? '#66BB6A' : '#2E7D32',
        border: isDark ? '#1F2A1F' : '#E8E8E8',
        footerText: isDark ? '#7AD27E' : '#2E7D32',
    };

    // Calculate scaling based on target size vs base size (800x600)
    const scale = Math.sqrt((size.width * size.height) / (800 * 600));

    // Dynamic Font Sizes: shrink with text length so multi-verse ranges still fit
    const lengthFactor = (length: number, threshold: number) =>
        length > threshold ? Math.max(0.3, Math.sqrt(threshold / length)) : 1;
    const arabicFontSize = Math.max(12, Math.min(96, 36 * scale * lengthFactor(arabicText.length, 150) * fontScale));
    const translationFontSize = Math.max(10, Math.min(48, 18 * scale * lengthFactor(translation.length, 200) * fontScale));
    const uiScale = 1 + (fontScale - 1) * 0.4;
    const titleFontSize = 22 * scale * uiScale;
    const footerFontSize = 14 * scale * uiScale;

    return (
        <View style={[
            styles.container,
            {
                width: size.width,
                height: size.height,
                backgroundColor: palette.background,
                padding: 40 * scale
            }
        ]}>
            {/* Outer Border */}
            <View style={[styles.outerBorder, { borderColor: palette.border }]} pointerEvents="none" />

            {/* Inner Decorative Border */}
            <View style={[styles.innerBorder, { borderColor: palette.accent, margin: 15 * scale }]} pointerEvents="none" />

            {/* Content Container */}
            <View style={styles.content}>
                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: palette.accent, fontSize: titleFontSize }]}>
                        {getVerseLabel(verseData, settings.verseNumberStyle)}
                    </Text>
                    <View style={[styles.titleLine, { backgroundColor: palette.accent, width: Math.min(300, size.width * 0.4) }]} />
                </View>

                {/* Arabic Text */}
                <View style={styles.textBlock}>
                    <Text style={[
                        styles.arabicText,
                        {
                            color: palette.text,
                            fontSize: arabicFontSize,
                            lineHeight: arabicFontSize * 1.6
                        },
                        // Custom families carry their own weight; fontWeight would make Android fall back to the system font
                        arabicFontFamily ? [styles.arabicTextCustomFont, { fontFamily: arabicFontFamily }] : null,
                    ]}>
                        {arabicText}
                    </Text>
                </View>

                {/* Gap */}
                <View style={{ height: 30 * scale }} />

                {/* Translation */}
                <View style={styles.textBlock}>
                    <Text style={[
                        styles.translationText,
                        {
                            color: palette.translation,
                            fontSize: translationFontSize,
                            lineHeight: translationFontSize * 1.4
                        }
                    ]}>
                        "{translation}"
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: palette.footerText, fontSize: footerFontSize }]}>
                    kuran360.com
                </Text>
            </View>
        </View>
    );
};
