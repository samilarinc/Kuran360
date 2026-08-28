import React, { useEffect } from 'react';
import { Text, Platform, StyleProp, TextStyle } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';
import { getFontOption, loadGoogleFont } from '../constants/fonts';

interface ArabicTextProps {
    children: React.ReactNode;
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
}

/** Renders Arabic text using the user's selected Arabic font (settings.arabicFont), loading the web font when needed. */
export const ArabicText: React.FC<ArabicTextProps> = ({ children, style, numberOfLines }) => {
    const { settings } = useSettings();
    const fontOption = getFontOption(settings.arabicFont);
    const fontFamily = Platform.select({
        web: fontOption.css,
        default: undefined as any,
    });

    useEffect(() => {
        if (Platform.OS === 'web') loadGoogleFont(fontOption);
    }, [settings.arabicFont]);

    return (
        <Text style={[style, { fontFamily }]} numberOfLines={numberOfLines}>
            {children}
        </Text>
    );
};
