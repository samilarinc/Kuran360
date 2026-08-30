import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { HijriPalette } from '@/utils/hijriCalendar';
import { HijriDayInfoRow } from '@/components/HijriDayInfoRow';
import { createStyles } from './index.styles';

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
