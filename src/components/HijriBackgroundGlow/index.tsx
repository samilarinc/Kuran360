import React from 'react';
import { View, Platform } from 'react-native';
import { HijriPalette } from '@/utils/hijriCalendar';

interface HijriBackgroundGlowProps {
    P: HijriPalette;
    cx: number;
    cy: number;
    height: number;
    ringR: number;
}

export const HijriBackgroundGlow: React.FC<HijriBackgroundGlowProps> = ({ P, cx, cy, height, ringR }) => {
    if (Platform.OS === 'web') return null;

    return (
        <>
            <View pointerEvents="none" style={{
                position: 'absolute', left: cx - ringR * 2.4, top: height * 0.16 - ringR * 2.4,
                width: ringR * 4.8, height: ringR * 4.8, borderRadius: ringR * 2.4,
                backgroundColor: P.bgGlow, opacity: 0.55,
            }} />
            <View pointerEvents="none" style={{
                position: 'absolute', left: cx - ringR * 1.5, top: cy - ringR * 1.5,
                width: ringR * 3, height: ringR * 3, borderRadius: ringR * 1.5,
                backgroundColor: P.bgGlow, opacity: 0.4,
            }} />
        </>
    );
};
