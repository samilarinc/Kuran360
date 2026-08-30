import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { HijriPalette } from '@/utils/hijriCalendar';
import { createStyles } from './index.styles';

interface HijriDayInfoRowProps {
    P: HijriPalette;
    dayLabel: string;
    dayLabelFontSize: number;
    dayLabelLineHeight: number;
    weekdayLabel: string;
    weekdayFontSize: number;
    monthLabel: string;
    monthFontSize: number;
    phaseLabel: string;
    phaseFontSize: number;
    gregLabel: string;
    gregFontSize: number;
}

export const HijriDayInfoRow: React.FC<HijriDayInfoRowProps> = ({
    P,
    dayLabel, dayLabelFontSize, dayLabelLineHeight,
    weekdayLabel, weekdayFontSize,
    monthLabel, monthFontSize,
    phaseLabel, phaseFontSize,
    gregLabel, gregFontSize,
}) => {
    const s = useMemo(() => createStyles(P), [P]);

    return (
        <View style={s.panelRow}>
            <View style={s.dayBlock}>
                <Text style={[s.dayNum, { fontSize: dayLabelFontSize, lineHeight: dayLabelLineHeight }]}>{dayLabel}</Text>
                <Text style={[s.dayWd, { fontSize: weekdayFontSize }]}>{weekdayLabel}</Text>
            </View>
            <View style={s.div} />
            <View style={s.detail}>
                <Text style={[s.detMonth, { fontSize: monthFontSize }]}>{monthLabel}</Text>
                <Text style={[s.detPhAr, { fontSize: phaseFontSize }]}>{phaseLabel}</Text>
                <Text style={[s.detGreg, { fontSize: gregFontSize }]}>{gregLabel}</Text>
            </View>
        </View>
    );
};
