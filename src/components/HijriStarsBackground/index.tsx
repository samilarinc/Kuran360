import React from 'react';
import { Animated } from 'react-native';
import { HijriPalette, STARS } from '@/utils/hijriCalendar';

interface HijriStarsBackgroundProps {
    P: HijriPalette;
    width: number;
    height: number;
    starAnims: Animated.Value[];
}

export const HijriStarsBackground: React.FC<HijriStarsBackgroundProps> = ({ P, width, height, starAnims }) => {
    if (!P.stars) return null;

    return (
        <>
            {STARS.map((st, i) => (
                <Animated.View key={i} pointerEvents="none" style={{
                    position: 'absolute', left: st.x * width, top: st.y * height,
                    width: st.r * 2, height: st.r * 2, borderRadius: st.r,
                    backgroundColor: P.text, opacity: Animated.multiply(starAnims[i], st.base),
                }} />
            ))}
        </>
    );
};
