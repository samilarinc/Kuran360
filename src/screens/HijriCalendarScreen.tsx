import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    View, Text, SafeAreaView, TouchableOpacity, PanResponder, Animated, Easing,
    Platform, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/theme';
import { AppHeader } from '@/components/AppHeader';
import { HijriStarsBackground } from '@/components/HijriStarsBackground';
import { HijriBackgroundGlow } from '@/components/HijriBackgroundGlow';
import { HijriCarousel } from '@/components/HijriCarousel';
import { HijriSideArrows } from '@/components/HijriSideArrows';
import { HijriHeaderPanel } from '@/components/HijriHeaderPanel';
import { HijriInfoPanel } from '@/components/HijriInfoPanel';
import { HijriTodayButton } from '@/components/HijriTodayButton';
import { HijriNotesModal } from '@/components/HijriNotesModal';
import {
    EMERALD, LAPIS, MONTHS, WD, GM, EVT, NOTES_KEY, P_IN, STARS,
    g2jd, jd2g, h2jd, jd2h, hMonthLen, addHM, toAr, moonPhase, phaseLabel, getTodayH, noteKey,
    HijriNoteEntry,
} from '@/utils/hijriCalendar';

export const HijriCalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { width, height } = useWindowDimensions();
    const { isDarkMode } = useTheme();
    const todayH = useMemo(() => getTodayH(), []);

    const P = isDarkMode ? EMERALD : LAPIS;

    const [viewY, setViewY] = useState(todayH.y);
    const [viewM, setViewM] = useState(todayH.m);
    const [selDay, setSelDay] = useState(todayH.d);
    const [busy, setBusy] = useState(false);
    const [notes, setNotes] = useState<Record<string, HijriNoteEntry[]>>({});
    const [modalDay, setModalDay] = useState<number | null>(null);
    const [draft, setDraft] = useState('');
    const [draftFocused, setDraftFocused] = useState(false);
    const [lang, setLang] = useState<'tr' | 'ar'>('tr');

    const dragP = useRef(new Animated.Value(0)).current;
    const daysAnim = useRef(new Animated.Value(1)).current;
    const starAnims = useRef(STARS.map(() => new Animated.Value(1))).current;
    const live = useRef({ viewY, viewM, busy, selDay });
    live.current = { viewY, viewM, busy, selDay };

    // Load notes (migrates old string format → array format)
    useEffect(() => {
        AsyncStorage.getItem(NOTES_KEY).then(raw => {
            if (!raw) return;
            try {
                const parsed = JSON.parse(raw) || {};
                const migrated: Record<string, HijriNoteEntry[]> = {};
                for (const [k, v] of Object.entries(parsed)) {
                    if (typeof v === 'string') {
                        migrated[k] = [{ id: k + '-0', text: v as string, ts: 0 }];
                    } else if (Array.isArray(v)) {
                        migrated[k] = v as HijriNoteEntry[];
                    }
                }
                setNotes(migrated);
            } catch { }
        }).catch(() => { });
    }, []);

    // Web: fonts + per-theme radial-gradient background
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const doc: any = (globalThis as any).document;
        if (!doc) return;
        try {
            if (!doc.getElementById('hijri-cal-fonts')) {
                const link = doc.createElement('link');
                link.id = 'hijri-cal-fonts';
                link.rel = 'stylesheet';
                link.href = 'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Aref+Ruqaa:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap';
                doc.head && doc.head.appendChild(link);
            }
            let style = doc.getElementById('hijri-cal-bg');
            if (!style) {
                style = doc.createElement('style');
                style.id = 'hijri-cal-bg';
                doc.head && doc.head.appendChild(style);
            }
            style.textContent = `#hijri-cal-root{background:${P.bgRadial} !important;}`;
        } catch { }
    }, [P]);

    // Star twinkle
    useEffect(() => {
        const loops = starAnims.map((a, i) =>
            Animated.loop(Animated.sequence([
                Animated.delay((i * 139) % 4200),
                Animated.timing(a, { toValue: 0.08, duration: 1600 + (i * 89) % 1800, useNativeDriver: true }),
                Animated.timing(a, { toValue: 1, duration: 1600 + (i * 97) % 1800, useNativeDriver: true }),
            ]))
        );
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, []);

    // ── Sizing (vmin-proportional) ─────────────────────────────────────────────
    const vmin = Math.min(width, height) / 100;
    const narrow = width < 560;
    const cx = width / 2;
    const cy = height * (narrow ? 0.48 : 0.52);
    const ringR = 30 * vmin;
    const moonR = 14.5 * vmin;
    const glyphR = 2.15 * vmin;
    const outerR = ringR + glyphR + 6;

    const panelW = Math.min(Math.max(width * 0.32, 170), 250);
    const fTitle = Math.max(22, Math.min(36, 3.8 * vmin));
    const fSub = Math.max(13, Math.min(17, 1.8 * vmin));
    const fSmall = Math.max(10, Math.min(13, 1.4 * vmin));
    const fDayNum = Math.max(30, Math.min(46, 4.2 * vmin));

    const len = hMonthLen(viewY, viewM);

    const gA = jd2g(h2jd(viewY, viewM, 1));
    const gB = jd2g(h2jd(viewY, viewM, len));
    const gregRange = gA[1] === gB[1] ? `${GM[gA[1]]} ${gA[0]}` : `${GM[gA[1]]} – ${GM[gB[1]]} ${gB[0]}`;

    // ── Day geometry (center month) ───────────────────────────────────────────
    const days = useMemo(() => {
        const out = [];
        for (let d = 1; d <= len; d++) {
            const angle = ((d - 1) / len) * 2 * Math.PI;
            const lx = ringR * Math.sin(angle);
            const ly = -ringR * Math.cos(angle);
            const jd = h2jd(viewY, viewM, d);
            const ph = moonPhase(jd);
            const shadowX = (ph.wax ? -1 : 1) * ph.illum * glyphR * 2;
            out.push({ d, lx, ly, shadowX, illum: ph.illum });
        }
        return out;
    }, [viewY, viewM, len, ringR, glyphR]);

    const sidePhase = (off: number) => {
        const [my, mm] = addHM(viewY, viewM, off);
        const ml = hMonthLen(my, mm);
        return moonPhase(h2jd(my, mm, Math.min(15, ml)));
    };

    // ── Selected day ──────────────────────────────────────────────────────────
    const selD = Math.min(selDay, len);
    const selJD = h2jd(viewY, viewM, selD);
    const [sg0, sg1, sg2] = jd2g(selJD);
    const wd = new Date(sg0, sg1 - 1, sg2).getDay();
    const selPh = moonPhase(selJD);
    const selEv = EVT[viewM]?.[selD];

    const isToday = viewY === todayH.y && viewM === todayH.m && selD === todayH.d;
    const isCurrentMonth = viewY === todayH.y && viewM === todayH.m;

    const goToday = () => {
        if (live.current.busy) return;
        if (isCurrentMonth) { setSelDay(todayH.d); return; }
        Animated.timing(daysAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
            setViewY(todayH.y); setViewM(todayH.m); setSelDay(todayH.d);
            dragP.setValue(0);
            Animated.timing(daysAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        });
    };

    // ── Navigation ────────────────────────────────────────────────────────────
    const commit = (dir: 1 | -1) => {
        if (live.current.busy) return;
        setBusy(true);
        Animated.parallel([
            Animated.timing(dragP, { toValue: dir, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(daysAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            const { viewY: vy, viewM: vm } = live.current;
            const [ny, nm] = addHM(vy, vm, dir);
            const nlen = hMonthLen(ny, nm);
            setViewY(ny); setViewM(nm);
            setSelDay(ny === todayH.y && nm === todayH.m ? todayH.d : Math.min(15, nlen));
            dragP.setValue(0);
            Animated.timing(daysAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
                setBusy(false);
            });
        });
    };

    const pan = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
        onPanResponderMove: (_, g) => {
            if (live.current.busy) return;
            dragP.setValue(Math.max(-1, Math.min(1, -g.dx / (width * 0.6))));
        },
        onPanResponderRelease: (_, g) => {
            const p = Math.max(-1, Math.min(1, -g.dx / (width * 0.6)));
            if (p > 0.22) commit(1);
            else if (p < -0.22) commit(-1);
            else Animated.spring(dragP, { toValue: 0, tension: 160, friction: 16, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () =>
            Animated.spring(dragP, { toValue: 0, tension: 160, friction: 16, useNativeDriver: true }).start(),
    })).current;

    // ── Day tap (select; second tap = open note) ──────────────────────────────
    const onDayPress = (d: number) => {
        if (d === live.current.selDay) {
            setModalDay(d);
            setDraft('');
            setDraftFocused(false);
        } else {
            setSelDay(d);
        }
    };

    const addNote = () => {
        if (!draft.trim() || modalDay == null) return;
        const k = noteKey(viewY, viewM, modalDay);
        const entry: HijriNoteEntry = { id: Date.now().toString(), text: draft.trim(), ts: Date.now() };
        const next = { ...notes, [k]: [...(notes[k] || []), entry] };
        setNotes(next);
        AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next)).catch(() => { });
        setDraft('');
        setDraftFocused(false);
    };

    const deleteNote = (id: string) => {
        if (modalDay == null) return;
        const k = noteKey(viewY, viewM, modalDay);
        const filtered = (notes[k] || []).filter(n => n.id !== id);
        const next = { ...notes };
        if (filtered.length) next[k] = filtered; else delete next[k];
        setNotes(next);
        AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next)).catch(() => { });
    };

    const modalDayClamped = modalDay != null ? Math.min(modalDay, len) : null;
    const modalDayNotes = modalDayClamped != null ? (notes[noteKey(viewY, viewM, modalDayClamped)] || []) : [];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: P.bg }} nativeID="hijri-cal-root">

            <AppHeader
                title={lang === 'tr' ? 'HİCRÎ AY TAKVİMİ' : 'التقويم الهجري'}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
                autoplayToggle={
                    <TouchableOpacity onPress={() => setLang(l => l === 'tr' ? 'ar' : 'tr')}
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, minWidth: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: '#fff' }}>{lang === 'tr' ? 'عربي' : 'TR'}</Text>
                    </TouchableOpacity>
                }
            />

            <View style={{ flex: 1, overflow: 'hidden', backgroundColor: P.bg }} {...pan.panHandlers}>

                <HijriBackgroundGlow P={P} cx={cx} cy={cy} height={height} ringR={ringR} />
                <HijriStarsBackground P={P} width={width} height={height} starAnims={starAnims} />

                <HijriCarousel
                    P={P}
                    dragP={dragP}
                    daysAnim={daysAnim}
                    cx={cx}
                    cy={cy}
                    outerR={outerR}
                    moonR={moonR}
                    glyphR={glyphR}
                    vmin={vmin}
                    days={days}
                    selPh={selPh}
                    sidePhase={sidePhase}
                    selDay={selD}
                    isDayToday={(d) => viewY === todayH.y && viewM === todayH.m && d === todayH.d}
                    hasEvent={(d) => !!(EVT[viewM]?.[d])}
                    hasNote={(d) => !!(notes[noteKey(viewY, viewM, d)]?.length)}
                    onDayPress={onDayPress}
                />

                <HijriSideArrows P={P} onPrev={() => commit(-1)} onNext={() => commit(1)} />

                <HijriHeaderPanel
                    P={P}
                    width={panelW}
                    monthAr={MONTHS[viewM - 1].ar}
                    monthLabel={lang === 'tr' ? MONTHS[viewM - 1].tr : MONTHS[viewM - 1].ar}
                    yearLabel={`${toAr(viewY)} هـ`}
                    gregRange={gregRange}
                    fTitle={fTitle}
                    fSub={fSub}
                    fSmall={fSmall}
                />

                <HijriInfoPanel
                    P={P}
                    width={panelW}
                    dayLabel={toAr(selD)}
                    weekdayLabel={WD[wd]}
                    monthLabel={`${MONTHS[viewM - 1].ar} ${toAr(viewY)} هـ`}
                    phaseLabel={lang === 'ar' ? phaseLabel(selPh).ar : phaseLabel(selPh).tr}
                    gregLabel={`${sg2} ${GM[sg1]} ${sg0}`}
                    event={selEv}
                    lang={lang}
                    fDayNum={fDayNum}
                    fSub={fSub}
                    fSmall={fSmall}
                />

                {!isToday && (
                    <HijriTodayButton P={P} label={lang === 'tr' ? '● Bugün' : '● اليوم'} onPress={goToday} />
                )}

            </View>

            <HijriNotesModal
                P={P}
                visible={modalDay != null}
                height={height}
                narrow={narrow}
                lang={lang}
                dayLabel={modalDayClamped != null ? toAr(modalDayClamped) : ''}
                weekdayLabel={WD[wd]}
                monthLabel={`${MONTHS[viewM - 1].ar}  ${toAr(viewY)} هـ`}
                phaseLabel={lang === 'ar' ? phaseLabel(selPh).ar : phaseLabel(selPh).tr}
                gregLabel={`${sg2} ${GM[sg1]} ${sg0}`}
                notes={modalDayNotes}
                draft={draft}
                draftFocused={draftFocused}
                onChangeDraft={setDraft}
                onFocusDraft={() => setDraftFocused(true)}
                onBlurDraft={() => { if (!draft.trim()) setDraftFocused(false); }}
                onAddNote={addNote}
                onDeleteNote={deleteNote}
                onClose={() => setModalDay(null)}
            />

        </SafeAreaView>
    );
};
