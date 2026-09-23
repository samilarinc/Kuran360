import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { HijriPalette, FONT } from '@/utils/hijriCalendar';
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
    event: { ar: string; tr: string } | undefined;
    lang: 'tr' | 'ar';
    fDayNum: number;
    fSub: number;
    fSmall: number;
}

export const HijriInfoPanel: React.FC<HijriInfoPanelProps> = ({
    P, width, dayLabel, weekdayLabel, monthLabel, phaseLabel, gregLabel, event, lang,
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
                {event && (
                    <View style={s.evBox}>
                        <Text style={[s.evAr, { fontSize: fSub }]}>
                            {lang === 'ar' ? event.ar : event.tr}
                        </Text>
                        {lang === 'ar' && (
                            <Text style={[s.evEn, { fontSize: fSmall }]}>{event.tr}</Text>
                        )}
                    </View>
                )}
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
    evAr: { color: P.gold, textAlign: 'center', fontFamily: FONT.amiri },
    evEn: { color: P.text, fontStyle: 'italic', opacity: 0.9, textAlign: 'center', marginTop: 2, fontFamily: FONT.cormorant },
});
