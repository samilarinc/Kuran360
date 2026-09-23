import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { HijriPalette, FONT } from '@/utils/hijriCalendar';
import { SPACING, FONT_SIZES } from '@/theme';

interface HijriTodayButtonProps {
    P: HijriPalette;
    label: string;
    onPress: () => void;
}

export const HijriTodayButton: React.FC<HijriTodayButtonProps> = ({ P, label, onPress }) => {
    const s = useMemo(() => createStyles(P), [P]);

    return (
        <TouchableOpacity style={s.todayBtn} onPress={onPress} activeOpacity={0.8}>
            <Text style={s.todayBtnTxt}>{label}</Text>
        </TouchableOpacity>
    );
};

const createStyles = (P: HijriPalette) => StyleSheet.create({
    todayBtn: {
        position: 'absolute', bottom: SPACING.lg, alignSelf: 'center', backgroundColor: P.panel,
        borderWidth: 1, borderColor: P.gold, borderRadius: 24,
        paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xl, zIndex: 10,
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
    },
    todayBtnTxt: { color: P.gold, fontSize: FONT_SIZES.small, letterSpacing: 1.5, fontFamily: FONT.cormorant, fontWeight: '600' },
});
