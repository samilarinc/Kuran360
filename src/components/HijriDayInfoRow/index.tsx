import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HijriPalette, FONT } from '@/utils/hijriCalendar';
import { SPACING } from '@/theme';

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

const createStyles = (P: HijriPalette) => StyleSheet.create({
    panelRow: { flexDirection: 'row', alignItems: 'center' },
    dayBlock: { alignItems: 'center', minWidth: 44 },
    dayNum: { fontWeight: '700', color: P.gold, fontFamily: FONT.aref },
    dayWd: { color: P.muted, marginTop: 2, fontFamily: FONT.amiri },
    div: { width: 1, alignSelf: 'stretch', backgroundColor: P.line, marginHorizontal: SPACING.sm },
    detail: { flexShrink: 1 },
    detMonth: { color: P.text, marginBottom: 2, fontFamily: FONT.amiri },
    detPhAr: { color: P.goldSoft, fontFamily: FONT.amiri },
    detGreg: { color: P.muted, letterSpacing: 0.8, marginTop: 4, textTransform: 'uppercase', fontFamily: FONT.cormorant },
});
