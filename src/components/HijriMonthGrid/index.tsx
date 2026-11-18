import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { Theme, SPACING, RADIUS, FONT_SIZES } from '@/theme';
import { TRANSLATION_FONT_FAMILY, TRANSLATION_FONT_FAMILY_SEMIBOLD } from '@/constants/fonts';
import { MoonPhase } from '@/components/MoonPhase';
import { getSpecialDay, h2jd, hMonthLen, hijriToDate, moonPhase } from '@/utils/hijriCalendar';
import { dateLocale } from '@/utils/hijriFormat';

interface HijriMonthGridProps {
    year: number;
    month: number;
    selectedDay: number;
    /** Today's day number when this month is the current one */
    todayDay?: number;
    hasNote: (day: number) => boolean;
    onSelect: (day: number) => void;
}

/** 2024-01-01 was a Monday; the week starts on Monday as in Turkey */
const MONDAY = new Date(2024, 0, 1);

/** The Hijri month as a week grid, each day with the moon of that night and its Gregorian date */
export const HijriMonthGrid: React.FC<HijriMonthGridProps> = ({ year, month, selectedDay, todayDay, hasNote, onSelect }) => {
    const { theme } = useTheme();
    const { i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const locale = dateLocale(i18n.language);

    const weekdays = useMemo(() => Array.from({ length: 7 }, (_, i) =>
        new Date(MONDAY.getFullYear(), 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }),
    ), [locale]);

    const cells = useMemo(() => {
        const len = hMonthLen(year, month);
        const lead = (hijriToDate(year, month, 1).getDay() + 6) % 7;
        const days = Array.from({ length: len }, (_, i) => {
            const day = i + 1;
            const date = hijriToDate(year, month, day);
            return {
                day,
                date,
                // A new Gregorian month starting inside the Hijri month gets its name, so the overlap is readable
                gregLabel: date.getDate() === 1 || day === 1
                    ? date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
                    : String(date.getDate()),
                phase: moonPhase(h2jd(year, month, day)),
                special: !!getSpecialDay(year, month, day),
            };
        });
        return [...Array<null>(lead).fill(null), ...days];
    }, [year, month, locale]);

    return (
        <View>
            <View style={styles.row}>
                {weekdays.map(w => (
                    <Text key={w} style={styles.weekday}>{w}</Text>
                ))}
            </View>
            <View style={styles.grid}>
                {cells.map((cell, i) => {
                    if (!cell) return <View key={`lead-${i}`} style={styles.cell} />;
                    const isToday = cell.day === todayDay;
                    const isSelected = cell.day === selectedDay;
                    return (
                        <View key={cell.day} style={styles.cell}>
                            <TouchableOpacity
                                style={[
                                    styles.dayButton,
                                    cell.special && styles.special,
                                    isToday && styles.today,
                                    isSelected && styles.selected,
                                ]}
                                onPress={() => onSelect(cell.day)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                                accessibilityLabel={cell.date.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}
                            >
                                <MoonPhase
                                    phase={cell.phase}
                                    size={13}
                                    litColor={isToday ? theme.featuredIcon : theme.accent}
                                    darkColor={isToday ? theme.featuredIconBackground : theme.border}
                                />
                                <Text style={[styles.hijriDay, isToday && styles.todayText]}>{cell.day}</Text>
                                <Text style={[styles.gregDay, isToday && styles.todayMuted]} numberOfLines={1}>{cell.gregLabel}</Text>
                                {hasNote(cell.day) && <View style={[styles.noteDot, isToday && styles.noteDotToday]} />}
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    row: { flexDirection: 'row' },
    weekday: {
        width: `${100 / 7}%`,
        textAlign: 'center',
        fontSize: FONT_SIZES.small - 1,
        color: theme.textSecondary,
        paddingBottom: SPACING.xs,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, padding: 2 },
    dayButton: {
        alignItems: 'center',
        paddingTop: 6,
        paddingBottom: 4,
        borderRadius: RADIUS.sm,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    special: { backgroundColor: theme.accent + '24' },
    today: { backgroundColor: theme.featured },
    selected: { borderColor: theme.primary },
    hijriDay: {
        fontFamily: TRANSLATION_FONT_FAMILY_SEMIBOLD,
        fontSize: FONT_SIZES.medium + 2,
        lineHeight: FONT_SIZES.medium + 7,
        color: theme.text,
        marginTop: 3,
    },
    gregDay: {
        fontFamily: TRANSLATION_FONT_FAMILY,
        fontSize: 10,
        color: theme.textSecondary,
    },
    todayText: { color: theme.featuredText },
    todayMuted: { color: theme.featuredMuted },
    noteDot: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: theme.primary,
    },
    noteDotToday: { backgroundColor: theme.featuredIcon },
});
