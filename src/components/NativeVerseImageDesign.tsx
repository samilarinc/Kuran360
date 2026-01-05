import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { VerseShareData, ImageSize } from '../types';

interface NativeVerseImageDesignProps {
    verseData: VerseShareData;
    themeMode: 'light' | 'dark';
    size: ImageSize;
}

export const NativeVerseImageDesign: React.FC<NativeVerseImageDesignProps> = ({
    verseData,
    themeMode,
    size,
}) => {
    const isDark = themeMode === 'dark';
    const { arabicText, translation, surahName, verseNumber } = verseData;

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

    // Dynamic Font Sizes (simplified but matching ratios)
    const arabicFontSize = Math.max(20, Math.min(60, 36 * scale * (arabicText.length > 150 ? 0.7 : 1)));
    const translationFontSize = Math.max(14, Math.min(28, 18 * scale * (translation.length > 200 ? 0.8 : 1)));
    const titleFontSize = 22 * scale;
    const footerFontSize = 14 * scale;

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
                        {surahName} Suresi - {verseNumber}. Ayet
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
                        }
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

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    outerBorder: {
        position: 'absolute',
        top: 5,
        left: 5,
        right: 5,
        bottom: 5,
        borderWidth: 1,
    },
    innerBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 0.5,
    },
    content: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 35,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    titleLine: {
        height: 1.5,
        marginTop: 15,
    },
    textBlock: {
        width: '100%',
        alignItems: 'center',
    },
    arabicText: {
        textAlign: 'center',
        fontWeight: '600',
        writingDirection: 'rtl',
        // Note: For native, we rely on default system font for Arabic unless linked
    },
    translationText: {
        textAlign: 'center',
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute',
        bottom: 35,
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        fontWeight: '500',
    },
});
