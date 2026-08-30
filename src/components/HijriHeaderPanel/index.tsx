import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { HijriPalette } from '@/utils/hijriCalendar';
import { createStyles } from './index.styles';

interface HijriHeaderPanelProps {
    P: HijriPalette;
    width: number;
    monthAr: string;
    monthLabel: string;
    yearLabel: string;
    gregRange: string;
    fTitle: number;
    fSub: number;
    fSmall: number;
}

export const HijriHeaderPanel: React.FC<HijriHeaderPanelProps> = ({
    P, width, monthAr, monthLabel, yearLabel, gregRange, fTitle, fSub, fSmall,
}) => {
    const s = useMemo(() => createStyles(P), [P]);

    return (
        <View style={[s.headerTL, { width }]}>
            <Text style={[s.hAr, { fontSize: fTitle, lineHeight: fTitle * 1.3 }]}>{monthAr}</Text>
            <Text style={[s.hLa, { fontSize: fSub }]}>{monthLabel} · {yearLabel}</Text>
            <Text style={[s.hGreg, { fontSize: fSmall }]}>{gregRange}</Text>
        </View>
    );
};
