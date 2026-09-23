import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { HijriPalette, FONT } from '@/utils/hijriCalendar';
import { SPACING } from '@/theme';

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

const createStyles = (P: HijriPalette) => StyleSheet.create({
    headerTL: {
        position: 'absolute', top: SPACING.md, left: SPACING.md, zIndex: 10,
        backgroundColor: P.panel,
        borderWidth: 1, borderColor: P.panelBorder,
        borderRadius: 12,
        paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm,
        alignItems: 'center',
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
    },
    hAr: { fontWeight: '700', color: P.gold, marginTop: 6, fontFamily: FONT.aref, textAlign: 'center' },
    hLa: { color: P.text, letterSpacing: 0.5, marginTop: 3, fontFamily: FONT.cormorant, textAlign: 'center' },
    hGreg: { color: P.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3, opacity: 0.9, fontFamily: FONT.cormorant, textAlign: 'center' },
});
