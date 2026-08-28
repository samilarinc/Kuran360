import React from 'react';
import { StyleSheet, Text, StyleProp, TextStyle } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';
import { getFontOption, getArabicFontFamily } from '../constants/fonts';

interface ArabicTextProps {
    children: React.ReactNode;
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
}

/** Renders Arabic text using the user's selected, bundled Arabic font (settings.arabicFont). */
export const ArabicText: React.FC<ArabicTextProps> = ({ children, style, numberOfLines }) => {
    const { settings } = useSettings();
    const fontOption = getFontOption(settings.arabicFont);
    const flatStyle = StyleSheet.flatten(style) ?? {};
    const isBold = flatStyle.fontWeight === 'bold' || Number(flatStyle.fontWeight) >= 600;
    const fontFamily = getArabicFontFamily(fontOption, isBold);

    return (
        <Text style={[style, { fontFamily }]} numberOfLines={numberOfLines}>
            {children}
        </Text>
    );
};
