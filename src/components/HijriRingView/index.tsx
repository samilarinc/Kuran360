import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Easing, Platform, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { HijriStarsBackground } from '@/components/HijriStarsBackground';
import { HijriBackgroundGlow } from '@/components/HijriBackgroundGlow';
import { HijriCarousel, RingArc } from '@/components/HijriCarousel';
import { HijriSideArrows } from '@/components/HijriSideArrows';
import { HijriHeaderPanel } from '@/components/HijriHeaderPanel';
import { HijriInfoPanel } from '@/components/HijriInfoPanel';
import { HijriTodayButton } from '@/components/HijriTodayButton';
import { HijriNotesModal } from '@/components/HijriNotesModal';
import { hijriNoteKey, NotesByDay } from '@/hooks/useHijriNotes';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import {
    MONTHS_AR, addHM, g2jd, getSpecialDay, h2jd, hMonthLen, hijriToDate, jd2h, moonPhase, phaseKey, specialDaysBetween,
} from '@/utils/hijriCalendar';
import { EMERALD, HijriPalette, LAPIS, RING_FONT, STARS, WEEKDAYS_AR, toArabicDigits } from '@/utils/hijriRing';
import { dateLocale, daysBetween } from '@/utils/hijriFormat';

interface HijriRingViewProps {
    year: number;
    month: number;
    day: number;
    today: { y: number; m: number; d: number };
    notes: NotesByDay;
    onSelectDay: (day: number) => void;
    /** Called once the carousel has turned to the next (1) or previous (-1) month */
    onMonthChange: (offset: 1 | -1) => void;
    onGoToday: () => void;
    onAddNote: (key: string, text: string) => void;
    onDeleteNote: (key: string, id: string) => void;
}

/** Share of a drag across the width that turns the month */
const DRAG_COMMIT = 0.22;

const monthIndex = (y: number, m: number) => y * 12 + m - 1;
const toDateJD = (date: Date) => g2jd(date.getFullYear(), date.getMonth() + 1, date.getDate());

/**
 * The month as a ring of moons around the selected night's moon, on a starry night sky.
 * The ring turns so the selected day sits at the top; swiping turns the month like a carousel.
 */
export const HijriRingView: React.FC<HijriRingViewProps> = ({
    year, month, day, today, notes, onSelectDay, onMonthChange, onGoToday, onAddNote, onDeleteNote,
}) => {
    const { isDarkMode } = useTheme();
    const { t, i18n } = useTranslation();
    const locale = dateLocale(i18n.language);
    const reduceMotion = useReduceMotion();
    const window = useWindowDimensions();
    const [size, setSize] = useState({ width: window.width, height: window.height });
    const [notesOpen, setNotesOpen] = useState(false);
    const [peekDay, setPeekDay] = useState<number | null>(null);
    const P = isDarkMode ? EMERALD : LAPIS;
    const s = useMemo(() => createStyles(P), [P]);

    const dragP = useRef(new Animated.Value(0)).current;
    const daysAnim = useRef(new Animated.Value(1)).current;
    const rotation = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0)).current;
    const starAnims = useRef(STARS.map(() => new Animated.Value(1))).current;
    const busy = useRef(false);
    // The pan responder is created once, so it reads the latest props through this ref
    const live = useRef({ onMonthChange, width: size.width });
    live.current = { onMonthChange, width: size.width };

    useEffect(() => {
        if (reduceMotion) return;
        const loops = starAnims.map((a, i) =>
            Animated.loop(Animated.sequence([
                Animated.delay((i * 139) % 4200),
                Animated.timing(a, { toValue: 0.08, duration: 1600 + (i * 89) % 1800, useNativeDriver: true }),
                Animated.timing(a, { toValue: 1, duration: 1600 + (i * 97) % 1800, useNativeDriver: true }),
            ]))
        );
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [starAnims, reduceMotion]);

    // ── Sizing, proportional to the shorter side ──────────────────────────────
    const { width, height } = size;
    const vmin = Math.min(width, height) / 100;
    const narrow = width < 560;
    const cx = width / 2;
    const cy = height * (narrow ? 0.48 : 0.5);
    const ringR = 30 * vmin;
    const moonR = 14.5 * vmin;
    const glyphR = 2.15 * vmin;
    const outerR = ringR + glyphR + 6;
    const panelW = Math.min(Math.max(width * 0.32, 170), 250);
    const fTitle = Math.max(22, Math.min(36, 3.8 * vmin));
    const fSub = Math.max(13, Math.min(17, 1.8 * vmin));
    const fSmall = Math.max(10, Math.min(13, 1.4 * vmin));
    const fDayNum = Math.max(30, Math.min(46, 4.2 * vmin));

    const len = hMonthLen(year, month);
    const isCurrentMonth = year === today.y && month === today.m;
    // Day 1 at the top; the ring's rotation then brings the selected day up
    const days = useMemo(() => Array.from({ length: len }, (_, i) => {
        const d = i + 1;
        const angle = (i / len) * 2 * Math.PI;
        const ph = moonPhase(h2jd(year, month, d));
        return {
            d,
            lx: ringR * Math.sin(angle),
            ly: -ringR * Math.cos(angle),
            shadowX: (ph.wax ? -1 : 1) * ph.illum * glyphR * 2,
            illum: ph.illum,
        };
    }), [year, month, len, ringR, glyphR]);

    // ── Ring rotation: the selected day turns to the top ──────────────────────
    const rotationDeg = useRef(0);
    const shownMonth = useRef(monthIndex(year, month));
    useEffect(() => {
        const target = -((day - 1) / len) * 360;
        const sameMonth = shownMonth.current === monthIndex(year, month);
        shownMonth.current = monthIndex(year, month);
        // Shortest way round, so day 29 → day 1 is one step, not a full turn back
        let delta = target - rotationDeg.current;
        delta -= Math.round(delta / 360) * 360;
        const next = rotationDeg.current + delta;
        rotationDeg.current = next;
        if (!sameMonth || reduceMotion) rotation.setValue(next);
        else Animated.timing(rotation, { toValue: next, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, [year, month, day, len, rotation, reduceMotion]);

    // ── What is near: tonight's or today's special day, and the next one ──────
    const now = useMemo(() => new Date(), []);
    const upcoming = useMemo(() => {
        const soon = specialDaysBetween(now, new Date(now.getFullYear(), now.getMonth() + 13, now.getDate()));
        const current = soon.find(s => daysBetween(now, s.def.night ? s.startDate : s.date) === 0);
        const next = soon.find(s => daysBetween(now, s.date) > 0 && s !== current);
        const withHijri = (s?: typeof soon[number]) => s && { ...s, hijri: jd2h(toDateJD(s.date)) };
        return { current: withHijri(current), next: withHijri(next) };
    }, [now]);

    const banner = upcoming.current && t(upcoming.current.def.night ? 'hijriCalendar.tonight' : 'hijriCalendar.todayIs', {
        name: t(`specialDays.names.${upcoming.current.def.id}`),
    });
    const pulseDay = upcoming.current && upcoming.current.hijri[0] === year && upcoming.current.hijri[1] === month
        ? upcoming.current.hijri[2] : undefined;

    useEffect(() => {
        if (pulseDay === undefined || reduceMotion) return;
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [pulseDay, pulse, reduceMotion]);

    // Gilded arc from today to the next special day, across the months in between
    const arc = useMemo((): RingArc | undefined => {
        const next = upcoming.next;
        if (!next) return undefined;
        const shown = monthIndex(year, month);
        const [ey, em, ed] = next.hijri;
        if (shown < monthIndex(today.y, today.m) || shown > monthIndex(ey, em)) return undefined;
        const endsHere = shown === monthIndex(ey, em);
        return {
            from: isCurrentMonth ? today.d : 1,
            to: endsHere ? ed : len,
            label: endsHere ? t('hijriCalendar.ringDaysLeft', { count: daysBetween(now, next.date) }) : undefined,
        };
    }, [upcoming, year, month, today, isCurrentMonth, len, now, t]);

    // ── Labels ────────────────────────────────────────────────────────────────
    const monthNames = t('hijriCalendar.months', { returnObjects: true }) as string[];
    const first = hijriToDate(year, month, 1);
    const last = hijriToDate(year, month, len);
    const gregRange = first.getMonth() === last.getMonth()
        ? first.toLocaleDateString(locale, { month: 'short', year: 'numeric' })
        : `${first.toLocaleDateString(locale, { month: 'short' })} – ${last.toLocaleDateString(locale, { month: 'short', year: 'numeric' })}`;
    const selDate = hijriToDate(year, month, day);
    const selPhase = moonPhase(h2jd(year, month, day));
    const special = getSpecialDay(year, month, day);
    const dayLabels = {
        weekdayLabel: WEEKDAYS_AR[selDate.getDay()],
        phaseLabel: t(`hijriCalendar.phases.${phaseKey(selPhase)}`),
        gregLabel: selDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    const noteKey = hijriNoteKey(year, month, day);
    const noteCount = notes[noteKey]?.length ?? 0;
    const nightStart = new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate() - 1);

    const peek = peekDay !== null ? (() => {
        const date = hijriToDate(year, month, peekDay);
        const peekSpecial = getSpecialDay(year, month, peekDay);
        return {
            title: `${peekDay} ${monthNames[month - 1]} ${year}`,
            date: date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            special: peekSpecial && t(`specialDays.names.${peekSpecial.id}`),
        };
    })() : null;

    // ── Navigation ────────────────────────────────────────────────────────────
    const fadeDaysIn = (done?: () => void) =>
        Animated.timing(daysAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(done);

    const turn = (dir: 1 | -1) => {
        if (busy.current) return;
        busy.current = true;
        Animated.parallel([
            Animated.timing(dragP, { toValue: dir, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(daysAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            live.current.onMonthChange(dir);
            dragP.setValue(0);
            fadeDaysIn(() => { busy.current = false; });
        });
    };
    const turnRef = useRef(turn);
    turnRef.current = turn;

    const goToday = () => {
        if (busy.current) return;
        if (isCurrentMonth) { onGoToday(); return; }
        Animated.timing(daysAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
            onGoToday();
            fadeDaysIn();
        });
    };

    const springBack = () => Animated.spring(dragP, { toValue: 0, tension: 160, friction: 16, useNativeDriver: true }).start();
    const progress = (dx: number) => Math.max(-1, Math.min(1, -dx / (live.current.width * 0.6)));

    const pan = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
        onPanResponderMove: (_, g) => { if (!busy.current) dragP.setValue(progress(g.dx)); },
        onPanResponderRelease: (_, g) => {
            const p = progress(g.dx);
            if (p > DRAG_COMMIT) turnRef.current(1);
            else if (p < -DRAG_COMMIT) turnRef.current(-1);
            else springBack();
        },
        onPanResponderTerminate: springBack,
    })).current;

    // A second tap on the selected day opens its notes
    const onDayPress = (d: number) => {
        if (d === day) setNotesOpen(true);
        else onSelectDay(d);
    };

    const onLayout = (e: LayoutChangeEvent) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        if (w !== size.width || h !== size.height) setSize({ width: w, height: h });
    };

    return (
        <View
            style={s.root}
            onLayout={onLayout}
            {...pan.panHandlers}
        >
            <HijriBackgroundGlow P={P} cx={cx} cy={cy} height={height} ringR={ringR} />
            <HijriStarsBackground P={P} width={width} height={height} starAnims={starAnims} />

            {banner && (
                <View pointerEvents="none" style={[s.banner, { top: cy - outerR - glyphR * 6 - fSub * 1.6 }]}>
                    <Text style={[s.bannerText, { fontSize: fSub + 1 }]}>{banner}</Text>
                </View>
            )}

            <HijriCarousel
                P={P}
                dragP={dragP}
                daysAnim={daysAnim}
                cx={cx}
                cy={cy}
                outerR={outerR}
                ringR={ringR}
                moonR={moonR}
                glyphR={glyphR}
                vmin={vmin}
                days={days}
                selPh={selPhase}
                sidePhase={offset => {
                    const [y, m] = addHM(year, month, offset);
                    return moonPhase(h2jd(y, m, Math.min(15, hMonthLen(y, m))));
                }}
                selDay={day}
                isDayToday={d => isCurrentMonth && d === today.d}
                hasEvent={d => !!getSpecialDay(year, month, d)}
                hasNote={d => !!notes[hijriNoteKey(year, month, d)]?.length}
                rotation={rotation}
                arc={arc}
                pulseDay={pulseDay}
                pulse={pulse}
                onDayPress={onDayPress}
                onDayLongPress={setPeekDay}
                onDayPressOut={() => setPeekDay(null)}
            />

            <HijriSideArrows P={P} onPrev={() => turn(-1)} onNext={() => turn(1)} />

            <HijriHeaderPanel
                P={P}
                width={panelW}
                monthAr={MONTHS_AR[month - 1]}
                monthLabel={monthNames[month - 1]}
                yearLabel={`${toArabicDigits(year)} هـ`}
                gregRange={gregRange}
                fTitle={fTitle}
                fSub={fSub}
                fSmall={fSmall}
            />

            <HijriInfoPanel
                P={P}
                width={panelW}
                dayLabel={toArabicDigits(day)}
                monthLabel={`${MONTHS_AR[month - 1]} ${toArabicDigits(year)} هـ`}
                eventName={special && t(`specialDays.names.${special.id}`)}
                eventDetail={special?.night
                    ? t('hijriCalendar.nightStarts', { date: nightStart.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) })
                    : undefined}
                notesLabel={noteCount ? t('hijriCalendar.noteCount', { count: noteCount }) : t('hijriCalendar.addNote')}
                onOpenNotes={() => setNotesOpen(true)}
                fDayNum={fDayNum}
                fSub={fSub}
                fSmall={fSmall}
                {...dayLabels}
            />

            {peek && (
                <View pointerEvents="none" style={[s.peekWrap, { top: cy + outerR + glyphR * 3 }]}>
                    <View style={s.peek}>
                        <Text style={[s.peekTitle, { fontSize: fSub + 1 }]}>{peek.title}</Text>
                        <Text style={[s.peekLine, { fontSize: fSmall + 1 }]}>{peek.date}</Text>
                        {peek.special && <Text style={[s.peekLine, s.peekSpecial, { fontSize: fSmall + 1 }]}>{peek.special}</Text>}
                    </View>
                </View>
            )}

            {!(isCurrentMonth && day === today.d) && (
                <HijriTodayButton P={P} label={`● ${t('hijriCalendar.today')}`} onPress={goToday} />
            )}

            <HijriNotesModal
                P={P}
                visible={notesOpen}
                height={height}
                narrow={narrow}
                dayLabel={toArabicDigits(day)}
                monthLabel={`${MONTHS_AR[month - 1]}  ${toArabicDigits(year)} هـ`}
                {...dayLabels}
                notes={notes[noteKey] || []}
                onAddNote={text => onAddNote(noteKey, text)}
                onDeleteNote={id => onDeleteNote(noteKey, id)}
                onClose={() => setNotesOpen(false)}
            />
        </View>
    );
};

const createStyles = (P: HijriPalette) => StyleSheet.create({
    root: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: P.bg,
        ...(Platform.OS === 'web' ? ({ backgroundImage: P.bgRadial } as any) : {}),
    },
    banner: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 4 },
    bannerText: { color: P.gold, fontFamily: RING_FONT.latinBold, textAlign: 'center' },
    peekWrap: { position: 'absolute', left: 24, right: 24, alignItems: 'center', zIndex: 12 },
    peek: {
        backgroundColor: P.panel,
        borderWidth: 1,
        borderColor: P.panelBorder,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        alignItems: 'center',
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
    },
    peekTitle: { color: P.gold, fontFamily: RING_FONT.latinBold },
    peekLine: { color: P.text, fontFamily: RING_FONT.latin, marginTop: 2 },
    peekSpecial: { color: P.gold },
});
