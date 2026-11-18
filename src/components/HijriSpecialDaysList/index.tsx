import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/contexts/ThemeContext';
import type { CommonStyles } from '@/contexts/ThemeContext';
import { Theme, SPACING, RADIUS, FONT_SIZES } from '@/theme';
import { TRANSLATION_FONT_FAMILY_SEMIBOLD } from '@/constants/fonts';
import { specialDaysOfYear } from '@/utils/hijriCalendar';
import { dateLocale, daysBetween } from '@/utils/hijriFormat';

interface HijriSpecialDaysListProps {
    year: number;
    today: Date;
    onSelect: (month: number, day: number) => void;
}

/** Kandils, bayrams and other blessed days of a Hijri year; past ones faded, upcoming ones with a countdown */
export const HijriSpecialDaysList: React.FC<HijriSpecialDaysListProps> = ({ year, today, onSelect }) => {
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const locale = dateLocale(i18n.language);
    const days = useMemo(() => specialDaysOfYear(year), [year]);
    const months = t('hijriCalendar.months', { returnObjects: true }) as string[];

    return (
        <View style={styles.card}>
            <Text style={styles.heading}>{t('hijriCalendar.specialDaysOfYear', { year })}</Text>
            {days.map(({ def, month, day, date }, index) => {
                const left = daysBetween(today, date);
                return (
                    <TouchableOpacity
                        key={def.id}
                        style={[styles.row, index === days.length - 1 && styles.rowLast, left < 0 && styles.past]}
                        onPress={() => onSelect(month, day)}
                    >
                        <View style={styles.dateCol}>
                            <Text style={styles.day}>{day}</Text>
                            <Text style={styles.month} numberOfLines={1}>{months[month - 1]}</Text>
                        </View>
                        <View style={styles.body}>
                            <Text style={styles.name}>{t(`specialDays.names.${def.id}`)}</Text>
                            <Text style={styles.greg}>
                                {date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                        </View>
                        {left >= 0 && (
                            <Text style={[styles.countdown, left === 0 && styles.countdownToday]}>
                                {left === 0 ? t('hijriCalendar.today') : t('hijriCalendar.daysLeft', { count: left })}
                            </Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    card: {
        ...common.card,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.lg,
    },
    heading: {
        fontFamily: TRANSLATION_FONT_FAMILY_SEMIBOLD,
        fontSize: FONT_SIZES.medium + 1,
        color: theme.text,
        paddingVertical: SPACING.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    rowLast: { borderBottomWidth: 0 },
    past: { opacity: 0.45 },
    dateCol: { width: 64, alignItems: 'center' },
    day: {
        fontFamily: TRANSLATION_FONT_FAMILY_SEMIBOLD,
        fontSize: FONT_SIZES.large,
        lineHeight: FONT_SIZES.large + 4,
        color: theme.accent,
    },
    month: { fontSize: 11, color: theme.textSecondary },
    body: { flex: 1 },
    name: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: theme.text },
    greg: { fontSize: FONT_SIZES.small - 1, color: theme.textSecondary, marginTop: 1 },
    countdown: { fontSize: FONT_SIZES.small - 1, color: theme.textSecondary },
    countdownToday: { color: theme.accent, fontWeight: '700' },
});
