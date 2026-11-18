import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, PanResponder, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronLeft, ChevronRight, Orbit } from 'lucide-react-native';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import type { CommonStyles } from '@/contexts/ThemeContext';
import { Theme, SPACING, RADIUS, FONT_SIZES } from '@/theme';
import { TRANSLATION_FONT_FAMILY_SEMIBOLD } from '@/constants/fonts';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { HijriRingView } from '@/components/HijriRingView';
import { HijriMonthGrid } from '@/components/HijriMonthGrid';
import { HijriDayCard } from '@/components/HijriDayCard';
import { HijriSpecialDaysList } from '@/components/HijriSpecialDaysList';
import { useHijriNotes, hijriNoteKey } from '@/hooks/useHijriNotes';
import { useSettings } from '@/contexts/SettingsContext';
import { fetchPrayerTimes, findPrayerLocation } from '@/services/prayerTimes';
import { MONTHS_AR, addHM, getSpecialDay, getTodayH, hMonthLen, hijriToDate } from '@/utils/hijriCalendar';
import { dateLocale } from '@/utils/hijriFormat';

type ViewMode = 'ring' | 'grid';
const VIEW_MODE_KEY = 'hijri-cal-view';

/** Horizontal drag that turns the month in the grid view */
const SWIPE_DISTANCE = 50;

export const HijriCalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const locale = dateLocale(i18n.language);
    const { settings } = useSettings();
    const { notes, addNote, deleteNote } = useHijriNotes();

    // Diyanet's month starts come with the prayer time data; once they load, the calendar is redrawn on them
    const [calendarVersion, setCalendarVersion] = useState(0);
    const locationId = settings.prayerLocation?.id;
    useEffect(() => {
        fetchPrayerTimes(findPrayerLocation(locationId)).then(() => {
            setTodayH(getTodayH());
            setCalendarVersion(v => v + 1);
        }).catch(() => { });
    }, [locationId]);
    const [todayH, setTodayH] = useState(getTodayH);
    const today = useMemo(() => new Date(), []);

    const [mode, setMode] = useState<ViewMode>('ring');
    useEffect(() => {
        AsyncStorage.getItem(VIEW_MODE_KEY).then(saved => { if (saved === 'grid' || saved === 'ring') setMode(saved); }).catch(() => { });
    }, []);
    const toggleMode = () => {
        const next: ViewMode = mode === 'ring' ? 'grid' : 'ring';
        setMode(next);
        AsyncStorage.setItem(VIEW_MODE_KEY, next).catch(() => { });
    };

    // The shown month and selected day, shared by both views
    const [view, setView] = useState({ y: todayH.y, m: todayH.m, d: todayH.d });
    // Today may move by a day or two once Diyanet's month starts are known
    const shownToday = useRef(todayH);
    useEffect(() => {
        const was = shownToday.current;
        shownToday.current = todayH;
        setView(prev => (prev.y === was.y && prev.m === was.m && prev.d === was.d ? { ...todayH } : prev));
    }, [todayH]);
    const isCurrentMonth = view.y === todayH.y && view.m === todayH.m;
    const isToday = isCurrentMonth && view.d === todayH.d;

    const goMonth = (offset: number) => setView(prev => {
        const [y, m] = addHM(prev.y, prev.m, offset);
        const d = y === todayH.y && m === todayH.m ? todayH.d : Math.min(prev.d, hMonthLen(y, m));
        return { y, m, d };
    });
    const goToday = () => setView({ ...todayH });
    const selectDay = (d: number) => setView(prev => ({ ...prev, d }));

    const goMonthRef = useRef(goMonth);
    goMonthRef.current = goMonth;
    const swipe = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
            if (g.dx <= -SWIPE_DISTANCE) goMonthRef.current(1);
            else if (g.dx >= SWIPE_DISTANCE) goMonthRef.current(-1);
        },
    })).current;

    const months = t('hijriCalendar.months', { returnObjects: true }) as string[];
    const len = hMonthLen(view.y, view.m);
    const first = hijriToDate(view.y, view.m, 1);
    const last = hijriToDate(view.y, view.m, len);
    const gregRange = first.getMonth() === last.getMonth()
        ? first.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        : `${first.toLocaleDateString(locale, { month: 'long' })} – ${last.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
    const noteKey = hijriNoteKey(view.y, view.m, view.d);

    const ToggleIcon = mode === 'ring' ? CalendarDays : Orbit;

    return (
        <View style={styles.container}>
            <AppHeader
                title={t('hijriCalendar.title')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
            />

            {mode === 'ring' ? (
                <HijriRingView
                    key={calendarVersion}
                    year={view.y}
                    month={view.m}
                    day={view.d}
                    today={todayH}
                    notes={notes}
                    onSelectDay={selectDay}
                    onMonthChange={goMonth}
                    onGoToday={goToday}
                    onAddNote={addNote}
                    onDeleteNote={deleteNote}
                />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.monthBar}>
                        <TouchableOpacity style={styles.arrow} onPress={() => goMonth(-1)} accessibilityLabel={t('hijriCalendar.previousMonth')}>
                            <ChevronLeft size={24} color={theme.iconPrimary} />
                        </TouchableOpacity>
                        <View style={styles.monthTitle}>
                            <Text style={styles.monthName}>{`${months[view.m - 1]} ${view.y}`}</Text>
                            <Text style={styles.monthArabic}>{MONTHS_AR[view.m - 1]}</Text>
                            <Text style={styles.gregRange}>{gregRange}</Text>
                        </View>
                        <TouchableOpacity style={styles.arrow} onPress={() => goMonth(1)} accessibilityLabel={t('hijriCalendar.nextMonth')}>
                            <ChevronRight size={24} color={theme.iconPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View {...swipe.panHandlers}>
                        <HijriMonthGrid
                            key={calendarVersion}
                            year={view.y}
                            month={view.m}
                            selectedDay={view.d}
                            todayDay={isCurrentMonth ? todayH.d : undefined}
                            hasNote={d => !!notes[hijriNoteKey(view.y, view.m, d)]?.length}
                            onSelect={selectDay}
                        />
                    </View>

                    {!isToday && (
                        <View style={styles.todayRow}>
                            <AppButton title={t('hijriCalendar.goToToday')} onPress={goToday} variant="outline" shape="pill" size="small" />
                        </View>
                    )}

                    <HijriDayCard
                        key={noteKey}
                        year={view.y}
                        month={view.m}
                        day={view.d}
                        special={getSpecialDay(view.y, view.m, view.d)}
                        notes={notes[noteKey] || []}
                        onAddNote={text => addNote(noteKey, text)}
                        onDeleteNote={id => deleteNote(noteKey, id)}
                    />

                    <HijriSpecialDaysList
                        year={view.y}
                        today={today}
                        onSelect={(m, d) => setView({ y: view.y, m, d })}
                    />
                </ScrollView>
            )}

            <TouchableOpacity
                style={[styles.modeButton, mode === 'ring' && styles.modeButtonOnRing]}
                onPress={toggleMode}
                accessibilityRole="button"
                accessibilityLabel={t(mode === 'ring' ? 'hijriCalendar.showGrid' : 'hijriCalendar.showRing')}
            >
                <ToggleIcon size={22} color={mode === 'ring' ? '#E6C570' : theme.featuredIcon} />
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => StyleSheet.create({
    container: { ...common.container },
    content: {
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
        padding: SPACING.md,
        // Leaves room under the last card for the floating view button
        paddingBottom: SPACING.xl + 56,
        gap: SPACING.md,
    },
    monthBar: { flexDirection: 'row', alignItems: 'center' },
    arrow: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthTitle: { flex: 1, alignItems: 'center' },
    monthName: {
        fontFamily: TRANSLATION_FONT_FAMILY_SEMIBOLD,
        fontSize: FONT_SIZES.xlarge,
        color: theme.text,
        textAlign: 'center',
    },
    monthArabic: {
        fontFamily: 'Amiri_400Regular',
        fontSize: FONT_SIZES.large,
        color: theme.accent,
        writingDirection: 'rtl',
    },
    gregRange: { fontSize: FONT_SIZES.small, color: theme.textSecondary },
    todayRow: { alignItems: 'center', marginTop: -SPACING.sm },
    modeButton: {
        position: 'absolute',
        right: SPACING.md,
        bottom: SPACING.lg,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.featured,
        borderWidth: 1,
        borderColor: theme.featuredBorder,
        zIndex: 20,
    },
    // On the night sky it matches the ring's own glass panels
    modeButtonOnRing: {
        backgroundColor: 'rgba(6,23,15,0.74)',
        borderColor: 'rgba(216,178,76,0.36)',
    },
});
