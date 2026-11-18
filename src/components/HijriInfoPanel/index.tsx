import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { HijriPalette, RING_FONT } from '@/utils/hijriRing';
import { HijriDayInfoRow } from '@/components/HijriDayInfoRow';
import { SPACING } from '@/theme';

interface HijriInfoPanelProps {
    P: HijriPalette;
    width: number;
    dayLabel: string;
    weekdayLabel: string;
    monthLabel: string;
    phaseLabel: string;
    gregLabel: string;
    /** Name of the special day, if the selected day is one */
    eventName?: string;
    /** One line under the special day's name, e.g. when its night begins */
    eventDetail?: string;
    /** "Not ekle" or "2 not"; tapping it opens the day's notes */
    notesLabel: string;
    onOpenNotes: () => void;
    fDayNum: number;
    fSub: number;
    fSmall: number;
}

export const HijriInfoPanel: React.FC<HijriInfoPanelProps> = ({
    P, width, dayLabel, weekdayLabel, monthLabel, phaseLabel, gregLabel, eventName, eventDetail, notesLabel, onOpenNotes,
    fDayNum, fSub, fSmall,
}) => {
    const s = useMemo(() => createStyles(P), [P]);

    return (
        <View style={[s.panelTR, { width }]}>
            <View style={s.panelCard}>
                <HijriDayInfoRow
                    P={P}
                    dayLabel={dayLabel}
                    dayLabelFontSize={fDayNum}
                    dayLabelLineHeight={fDayNum * 1.05}
                    weekdayLabel={weekdayLabel}
                    weekdayFontSize={fSmall}
                    monthLabel={monthLabel}
                    monthFontSize={fSub}
                    phaseLabel={phaseLabel}
                    phaseFontSize={fSmall + 1}
                    gregLabel={gregLabel}
                    gregFontSize={fSmall}
                />
                {eventName && (
                    <View style={s.evBox}>
                        <Text style={[s.evName, { fontSize: fSub }]}>{eventName}</Text>
                        {eventDetail && <Text style={[s.evDetail, { fontSize: fSmall }]}>{eventDetail}</Text>}
                    </View>
                )}
                <TouchableOpacity style={s.notesRow} onPress={onOpenNotes} hitSlop={6} accessibilityRole="button">
                    <Text style={[s.notesText, { fontSize: fSmall }]}>{notesLabel}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const createStyles = (P: HijriPalette) => StyleSheet.create({
    panelTR: { position: 'absolute', top: SPACING.md, right: SPACING.md, zIndex: 10, alignItems: 'flex-end' },
    panelCard: {
        backgroundColor: P.panel, borderWidth: 1, borderColor: P.panelBorder, borderRadius: 6,
        paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm,
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
    },
    evBox: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: P.line, alignItems: 'center' },
    evName: { color: P.gold, textAlign: 'center', fontFamily: RING_FONT.naskh },
    evDetail: { color: P.muted, textAlign: 'center', marginTop: 2, fontFamily: RING_FONT.latin },
    notesRow: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: P.line, alignItems: 'center' },
    notesText: { color: P.goldSoft, fontFamily: RING_FONT.latin },
});
