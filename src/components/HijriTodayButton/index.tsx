import React, { useMemo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { HijriPalette } from '@/utils/hijriCalendar';
import { createStyles } from './index.styles';

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
