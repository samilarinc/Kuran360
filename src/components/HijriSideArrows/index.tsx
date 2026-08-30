import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { HijriPalette } from '@/utils/hijriCalendar';

const createStyles = (P: HijriPalette) => StyleSheet.create({
    sideArrow: { position: 'absolute', top: 0, bottom: 0, width: 40, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
    sideArrowText: { fontSize: 36, color: P.goldSoft, opacity: 0.5, lineHeight: 42 },
});

interface HijriSideArrowsProps {
    P: HijriPalette;
    onPrev: () => void;
    onNext: () => void;
}

export const HijriSideArrows: React.FC<HijriSideArrowsProps> = ({ P, onPrev, onNext }) => {
    const s = useMemo(() => createStyles(P), [P]);

    return (
        <>
            <TouchableOpacity style={[s.sideArrow, { left: 0 }]} onPress={onPrev}>
                <Text style={s.sideArrowText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.sideArrow, { right: 0 }]} onPress={onNext}>
                <Text style={s.sideArrowText}>›</Text>
            </TouchableOpacity>
        </>
    );
};
