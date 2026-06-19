import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet, TouchableOpacity, TextInput,
  PanResponder, Animated, Easing, Modal, Platform, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../constants';

// ── Calendar math ─────────────────────────────────────────────────────────────

function mod(a: number, b: number) { return a - b * Math.floor(a / b); }
function leapG(y: number) { return y % 4 === 0 && !((y % 100 === 0) && y % 400 !== 0); }
function g2jd(y: number, m: number, d: number) {
  return 1721424.5 + 365 * (y - 1) + Math.floor((y - 1) / 4) - Math.floor((y - 1) / 100)
    + Math.floor((y - 1) / 400) + Math.floor((367 * m - 362) / 12 + (m <= 2 ? 0 : leapG(y) ? -1 : -2) + d);
}
function jd2g(jd: number): [number, number, number] {
  const w = Math.floor(jd - 0.5) + 0.5, dep = w - 1721425.5;
  const qc = Math.floor(dep / 146097), dqc = mod(dep, 146097);
  const c  = Math.floor(dqc / 36524), dc  = mod(dqc, 36524);
  const q  = Math.floor(dc  / 1461),  dq  = mod(dc,  1461);
  const yi = Math.floor(dq / 365);
  let y = qc * 400 + c * 100 + q * 4 + yi;
  if (!(c === 4 || yi === 4)) y++;
  const yd = w - g2jd(y, 1, 1);
  const la = w < g2jd(y, 3, 1) ? 0 : leapG(y) ? 1 : 2;
  const m  = Math.floor(((yd + la) * 12 + 373) / 367);
  return [y, m, (w - g2jd(y, m, 1)) + 1];
}
function h2jd(y: number, m: number, d: number) {
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948438.5;
}
function jd2h(jd: number): [number, number, number] {
  jd = Math.floor(jd) + 0.5;
  const y = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631);
  const m = Math.min(12, Math.ceil((jd - (29 + h2jd(y, 1, 1))) / 29.5) + 1);
  return [y, m, Math.round(jd - h2jd(y, m, 1)) + 1];
}
function hMonthLen(y: number, m: number) {
  return Math.round((m === 12 ? h2jd(y + 1, 1, 1) : h2jd(y, m + 1, 1)) - h2jd(y, m, 1));
}
function addHM(y: number, m: number, off: number): [number, number] {
  const k = (m - 1) + off;
  return [y + Math.floor(k / 12), mod(k, 12) + 1];
}
function toAr(n: number) { return String(Math.round(n)).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]); }
function moonPhase(jd: number) {
  const frac = mod(jd - 2451550.1, 29.530588853) / 29.530588853;
  return { illum: (1 - Math.cos(2 * Math.PI * frac)) / 2, wax: frac < 0.5 };
}
function phaseLabel(p: { illum: number; wax: boolean }) {
  const i = p.illum;
  if (i < 0.04) return { ar: 'مُحاق', tr: 'Yeni Ay' };
  if (i > 0.96) return { ar: 'بَدْر', tr: 'Dolunay' };
  if (Math.abs(i - 0.5) < 0.07) return p.wax ? { ar: 'تَربيع أوّل', tr: 'İlk Dördün' } : { ar: 'تَربيع أخير', tr: 'Son Dördün' };
  if (i < 0.5) return p.wax ? { ar: 'هِلال مُتزايد', tr: 'Büyüyen Hilal' } : { ar: 'هِلال مُتناقص', tr: 'Küçülen Hilal' };
  return p.wax ? { ar: 'أحدَب مُتزايد', tr: 'Büyüyen Şişkin Ay' } : { ar: 'أحدَب مُتناقص', tr: 'Küçülen Şişkin Ay' };
}

// ── Static data ───────────────────────────────────────────────────────────────

const MONTHS = [
  { ar: 'المُحَرَّم', tr: 'Muharrem' },     { ar: 'صَفَر', tr: 'Safer' },
  { ar: 'رَبيع الأوّل', tr: 'Rebiülevvel' }, { ar: 'رَبيع الآخِر', tr: 'Rebiülahir' },
  { ar: 'جُمادى الأولى', tr: 'Cemaziyelevvel' }, { ar: 'جُمادى الآخِرة', tr: 'Cemaziyelahir' },
  { ar: 'رَجَب', tr: 'Recep' },              { ar: 'شَعْبان', tr: 'Şaban' },
  { ar: 'رَمَضان', tr: 'Ramazan' },          { ar: 'شَوّال', tr: 'Şevval' },
  { ar: 'ذو القَعْدة', tr: 'Zilkade' },      { ar: 'ذو الحِجّة', tr: 'Zilhicce' },
];
const WD = ['الأحَد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخَميس', 'الجُمعة', 'السَّبت'];
const GM = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const EVT: Record<number, Record<number, { ar: string; tr: string }>> = {
  1:  { 1:  { ar: 'رأس السنة الهجرية', tr: 'Hicri Yılbaşı' },
        10: { ar: 'يوم عاشوراء', tr: 'Aşure Günü' } },
  3:  { 12: { ar: 'المولد النبوي', tr: 'Mevlid Kandili' } },
  7:  { 27: { ar: 'الإسراء والمعراج', tr: 'Miraç Kandili' } },
  8:  { 15: { ar: 'ليلة البَراءة', tr: 'Berat Kandili' } },
  9:  { 1:  { ar: 'أوّل رمضان', tr: 'Ramazan Başlangıcı' },
        27: { ar: 'ليلة القَدْر', tr: 'Kadir Gecesi' } },
  10: { 1:  { ar: 'عيد الفِطر', tr: 'Ramazan Bayramı' } },
  12: { 8:  { ar: 'يوم التَّروية', tr: 'Terviye Günü' },
        9:  { ar: 'يوم عَرَفة', tr: 'Arefe Günü' },
        10: { ar: 'عيد الأضحى', tr: 'Kurban Bayramı' } },
};

// ── Palettes (original "Midnight Emerald" dark + "Parchment Ink" light) ────────

type Palette = {
  bg: string; bgRadial: string; bgGlow: string;
  text: string; muted: string; gold: string; goldSoft: string;
  moonIvory: string; moonLit2: string; moonDark: string;
  line: string; panel: string; panelBorder: string;
  glowRGB: string; stars: boolean;
};

const EMERALD: Palette = {
  bg: '#0c2c1f',
  bgRadial: 'radial-gradient(125% 120% at 50% 16%, #14402e 0%, #0c2c1f 42%, #06180f 74%, #040f0a 100%)',
  bgGlow: 'rgba(20,64,46,0.6)',
  text: '#e8ebd2', muted: '#9cb8a6', gold: '#d8b24c', goldSoft: '#bd9a3f',
  moonIvory: '#edefdb', moonLit2: '#fbfcf0', moonDark: '#05150d',
  line: 'rgba(216,178,76,0.28)', panel: 'rgba(6,23,15,0.74)', panelBorder: 'rgba(216,178,76,0.36)',
  glowRGB: '216,178,76', stars: true,
};
const LAPIS: Palette = {
  bg: '#101d4a',
  bgRadial: 'radial-gradient(125% 120% at 50% 16%, #1d2f69 0%, #122152 40%, #0a1336 72%, #060b22 100%)',
  bgGlow: 'rgba(29,47,105,0.6)',
  text: '#ece4cc', muted: '#9bacd4', gold: '#e6c570', goldSoft: '#cbab5e',
  moonIvory: '#ece2c7', moonLit2: '#fbf7ec', moonDark: '#0b1535',
  line: 'rgba(220,184,86,0.30)', panel: 'rgba(11,20,52,0.74)', panelBorder: 'rgba(220,184,86,0.38)',
  glowRGB: '230,197,112', stars: true,
};

const FONT = Platform.OS === 'web'
  ? { aref: 'Aref Ruqaa', amiri: 'Amiri', cormorant: 'Cormorant Garamond' }
  : { aref: undefined as any, amiri: undefined as any, cormorant: undefined as any };

const NOTES_KEY = 'hijri-cal-notes';
const P_IN = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
const STAGES = [-1, 0, 1];

function getTodayH() {
  const t = new Date();
  const [y, m, d] = jd2h(g2jd(t.getFullYear(), t.getMonth() + 1, t.getDate()));
  return { y, m, d };
}

const STARS = Array.from({ length: 54 }, () => ({
  x: Math.random(), y: Math.random(),
  r: Math.random() * 1.5 + 0.4, base: Math.random() * 0.5 + 0.2,
}));

const noteKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

// ── Moon disk ─────────────────────────────────────────────────────────────────

const MoonDisk: React.FC<{ r: number; phase: { illum: number; wax: boolean }; P: Palette; glow?: boolean; dim?: boolean }> = ({ r, phase, P, glow, dim }) => {
  const shadowX = (phase.wax ? -1 : 1) * phase.illum * r * 2;
  const web = Platform.OS === 'web';
  return (
    <View style={[
      { width: r * 2, height: r * 2, borderRadius: r, backgroundColor: P.moonIvory, overflow: 'hidden' },
      web
        ? ({
            boxShadow:
              `inset ${(-r * 0.16).toFixed(1)}px ${(-r * 0.18).toFixed(1)}px ${(r * 0.5).toFixed(1)}px rgba(33,25,11,0.35), ` +
              `inset ${(r * 0.1).toFixed(1)}px ${(r * 0.1).toFixed(1)}px ${(r * 0.4).toFixed(1)}px rgba(255,250,235,0.4)` +
              (glow ? `, 0 0 ${(r * 0.9).toFixed(1)}px rgba(${P.glowRGB},0.5), 0 0 ${(r * 1.9).toFixed(1)}px rgba(${P.glowRGB},0.22), 0 0 0 1.4px rgba(${P.glowRGB},0.5)` : ''),
            ...(dim ? { filter: 'blur(3px)' } : {}),
          } as any)
        : (glow
            ? ({ shadowColor: P.gold, shadowOpacity: 0.5, shadowRadius: r * 0.5, shadowOffset: { width: 0, height: 0 }, elevation: 12, borderWidth: 1, borderColor: `rgba(${P.glowRGB},0.45)` })
            : ({ opacity: dim ? 0.92 : 1 })),
    ]}>
      <View style={{ position: 'absolute', left: '16%', top: '14%', width: '22%', height: '18%', borderRadius: 99, backgroundColor: 'rgba(78,64,40,0.13)' }} />
      <View style={{ position: 'absolute', left: '50%', top: '22%', width: '14%', height: '12%', borderRadius: 99, backgroundColor: 'rgba(78,64,40,0.10)' }} />
      <View style={{ position: 'absolute', left: '26%', top: '50%', width: '24%', height: '19%', borderRadius: 99, backgroundColor: 'rgba(78,64,40,0.12)' }} />
      <View style={{ position: 'absolute', left: '60%', top: '56%', width: '11%', height: '9%', borderRadius: 99, backgroundColor: 'rgba(78,64,40,0.09)' }} />
      <View style={[
        { position: 'absolute', width: r * 2, height: r * 2, borderRadius: r, backgroundColor: P.moonDark, transform: [{ translateX: shadowX }] },
        web ? ({ filter: 'blur(1.5px)' } as any) : {},
      ]} />
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

export const HijriCalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const todayH = useMemo(() => getTodayH(), []);

  const P = isDarkMode ? EMERALD : LAPIS;
  const s = useMemo(() => createStyles(P), [P]);

  const [viewY, setViewY] = useState(todayH.y);
  const [viewM, setViewM] = useState(todayH.m);
  const [selDay, setSelDay] = useState(todayH.d);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [modalDay, setModalDay] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const dragP = useRef(new Animated.Value(0)).current;
  const starAnims = useRef(STARS.map(() => new Animated.Value(1))).current;
  const live = useRef({ viewY, viewM, busy, selDay });
  live.current = { viewY, viewM, busy, selDay };

  // Load notes
  useEffect(() => {
    AsyncStorage.getItem(NOTES_KEY)
      .then(raw => { if (raw) try { setNotes(JSON.parse(raw) || {}); } catch {} })
      .catch(() => {});
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
    } catch {}
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
  const cy = height * (narrow ? 0.5 : 0.54);
  const ringR = 27.5 * vmin;
  const moonR = 14.5 * vmin;
  const glyphR = 1.9 * vmin;
  const numSize = 2.0 * vmin;
  const outerR = ringR + glyphR * 1.6 + numSize * 2.6 + 6;

  const fTitle  = Math.max(20, Math.min(44, 4.8 * vmin));
  const fKicker = Math.max(9,  Math.min(13, 1.4 * vmin));
  const fSub    = Math.max(12, Math.min(19, 2.0 * vmin));
  const fSmall  = Math.max(10, Math.min(15, 1.5 * vmin));
  const fDayNum = Math.max(30, Math.min(52, 4.8 * vmin));

  const len = hMonthLen(viewY, viewM);

  // ── Carousel transform per stage ──────────────────────────────────────────
  const theta = (e: number) => Math.max(-1.45, Math.min(1.45, e * 0.92));
  const stageStyle = (off: number) => ({
    opacity: dragP.interpolate({ inputRange: P_IN, outputRange: P_IN.map(p => Math.pow(Math.max(0, Math.cos(theta(off - p))), 1.7)) }),
    transform: [
      { perspective: 1700 },
      { translateX: dragP.interpolate({ inputRange: P_IN, outputRange: P_IN.map(p => Math.sin(theta(off - p)) * 47 * vmin) }) },
      { scale: dragP.interpolate({ inputRange: P_IN, outputRange: P_IN.map(p => 0.4 + 0.6 * Math.max(0, Math.cos(theta(off - p)))) }) },
      { rotateY: dragP.interpolate({ inputRange: P_IN, outputRange: P_IN.map(p => `${(-Math.sin(theta(off - p)) * 38).toFixed(2)}deg`) }) },
    ],
  });

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
      out.push({ d, lx, ly, shadowX });
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

  const gA = jd2g(h2jd(viewY, viewM, 1));
  const gB = jd2g(h2jd(viewY, viewM, len));
  const gregRange = gA[1] === gB[1] ? `${GM[gA[1]]} ${gA[0]}` : `${GM[gA[1]]} – ${GM[gB[1]]} ${gB[0]}`;

  const isToday = viewY === todayH.y && viewM === todayH.m && selD === todayH.d;

  // ── Navigation ────────────────────────────────────────────────────────────
  const commit = (dir: 1 | -1) => {
    if (live.current.busy) return;
    setBusy(true);
    Animated.timing(dragP, { toValue: dir, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      const { viewY: vy, viewM: vm } = live.current;
      const [ny, nm] = addHM(vy, vm, dir);
      const nlen = hMonthLen(ny, nm);
      setViewY(ny); setViewM(nm);
      setSelDay(ny === todayH.y && nm === todayH.m ? todayH.d : Math.min(15, nlen));
      dragP.setValue(0);
      setBusy(false);
    });
  };

  const goToday = () => {
    if (live.current.busy) return;
    dragP.setValue(0);
    setViewY(todayH.y); setViewM(todayH.m); setSelDay(todayH.d);
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
      setDraft(notes[noteKey(viewY, viewM, d)] || '');
    } else {
      setSelDay(d);
    }
  };

  const saveNote = () => {
    if (modalDay == null) return;
    const k = noteKey(viewY, viewM, modalDay);
    const next = { ...notes };
    if (draft.trim()) next[k] = draft.trim(); else delete next[k];
    setNotes(next);
    AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next)).catch(() => {});
    setModalDay(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} nativeID="hijri-cal-root">
      <View style={{ flex: 1 }} {...pan.panHandlers}>

        {/* Background glow (native; web uses CSS gradient) */}
        {Platform.OS !== 'web' && (
          <>
            <View pointerEvents="none" style={{
              position: 'absolute', left: cx - ringR * 2.4, top: height * 0.16 - ringR * 2.4,
              width: ringR * 4.8, height: ringR * 4.8, borderRadius: ringR * 2.4,
              backgroundColor: P.bgGlow, opacity: 0.55,
            }} />
            <View pointerEvents="none" style={{
              position: 'absolute', left: cx - ringR * 1.5, top: cy - ringR * 1.5,
              width: ringR * 3, height: ringR * 3, borderRadius: ringR * 1.5,
              backgroundColor: P.bgGlow, opacity: 0.4,
            }} />
          </>
        )}

        {/* Stars (dark themes only) */}
        {P.stars && STARS.map((st, i) => (
          <Animated.View key={i} pointerEvents="none" style={{
            position: 'absolute', left: st.x * width, top: st.y * height,
            width: st.r * 2, height: st.r * 2, borderRadius: st.r,
            backgroundColor: P.text, opacity: Animated.multiply(starAnims[i], st.base),
          }} />
        ))}

        {/* Carousel stages */}
        {STAGES.map(off => {
          const isCenter = off === 0;
          return (
            <Animated.View
              key={off}
              pointerEvents={isCenter ? 'box-none' : 'none'}
              style={[
                { position: 'absolute', left: cx - outerR, top: cy - outerR, width: outerR * 2, height: outerR * 2, zIndex: isCenter ? 3 : 1 },
                stageStyle(off),
              ]}
            >
              {/* Moon disk */}
              <View style={{ position: 'absolute', left: outerR - moonR, top: outerR - moonR }}>
                <MoonDisk r={moonR} phase={isCenter ? selPh : sidePhase(off)} P={P} glow={isCenter} dim={!isCenter} />
              </View>

              {/* Day glyphs + numbers */}
              {isCenter && days.map(({ d, lx, ly, shadowX }) => {
                const dayIsToday = viewY === todayH.y && viewM === todayH.m && d === todayH.d;
                const isSel = d === selD;
                const hasEv = !!(EVT[viewM]?.[d]);
                const hasNote = !!notes[noteKey(viewY, viewM, d)];
                const r = isSel ? glyphR * 1.32 : dayIsToday ? glyphR * 1.12 : glyphR;
                const gx = outerR + lx, gy = outerR + ly;
                return (
                  <React.Fragment key={d}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onDayPress(d)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={[
                        {
                          position: 'absolute', left: gx - r, top: gy - r,
                          width: r * 2, height: r * 2, borderRadius: r,
                          backgroundColor: P.moonIvory, overflow: 'hidden',
                          borderWidth: isSel ? 1.5 : dayIsToday ? 1 : 0,
                          borderColor: isSel ? P.gold : P.goldSoft,
                        },
                        isSel && (Platform.OS === 'web'
                          ? ({ boxShadow: `0 0 ${r * 1.8}px rgba(${P.glowRGB},0.85), 0 0 ${r}px rgba(${P.glowRGB},0.5)` } as any)
                          : ({ shadowColor: P.gold, shadowOpacity: 0.85, shadowRadius: r, shadowOffset: { width: 0, height: 0 }, elevation: 8 })),
                        !isSel && dayIsToday && (Platform.OS === 'web'
                          ? ({ boxShadow: `0 0 ${r * 1.4}px rgba(${P.glowRGB},0.6)` } as any)
                          : ({ shadowColor: P.goldSoft, shadowOpacity: 0.55, shadowRadius: r * 0.7, shadowOffset: { width: 0, height: 0 }, elevation: 4 })),
                      ]}
                    >
                      <View style={[
                        { position: 'absolute', width: r * 2, height: r * 2, borderRadius: r, backgroundColor: P.moonDark, transform: [{ translateX: shadowX }] },
                        Platform.OS === 'web' ? ({ filter: 'blur(0.8px)' } as any) : {},
                      ]} />
                    </TouchableOpacity>

                    {(hasEv || hasNote) && (
                      <View style={{
                        position: 'absolute', left: gx - r * 0.2, top: gy + r + 1,
                        width: r * 0.4, height: r * 0.4, borderRadius: 99,
                        backgroundColor: hasEv ? P.gold : 'transparent',
                        borderWidth: hasEv ? 0 : 1, borderColor: P.goldSoft,
                      }} />
                    )}

                    <Text
                      onPress={() => onDayPress(d)}
                      style={{
                        position: 'absolute',
                        left: gx - numSize * 1.1,
                        top: gy + r + (hasEv || hasNote ? r * 0.5 + 2 : 1),
                        width: numSize * 2.2, textAlign: 'center',
                        fontSize: isSel || dayIsToday ? numSize * 1.18 : numSize,
                        lineHeight: (isSel || dayIsToday ? numSize * 1.18 : numSize) + 3,
                        color: isSel || dayIsToday ? P.gold : hasEv ? P.goldSoft : P.muted,
                        fontWeight: isSel || dayIsToday ? '700' : '400',
                        fontFamily: FONT.amiri,
                      }}
                    >
                      {toAr(d)}
                    </Text>
                  </React.Fragment>
                );
              })}
            </Animated.View>
          );
        })}

        {/* Side arrows */}
        <TouchableOpacity style={[s.sideArrow, { left: 0 }]} onPress={() => commit(-1)}>
          <Text style={s.sideArrowText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.sideArrow, { right: 0 }]} onPress={() => commit(1)}>
          <Text style={s.sideArrowText}>›</Text>
        </TouchableOpacity>

        {/* ── Header (top-left) ── */}
        <View style={[s.headerTL, narrow && { maxWidth: width * 0.5 }]}>
          <View style={s.kickerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={[s.kicker, { fontSize: fKicker }]}>HİCRÎ AY TAKVİMİ</Text>
          </View>
          <Text style={[s.hAr, { fontSize: fTitle, lineHeight: fTitle * 1.1 }]}>{MONTHS[viewM - 1].ar}</Text>
          <Text style={[s.hLa, { fontSize: fSub }]}>{MONTHS[viewM - 1].tr} · {toAr(viewY)} هـ</Text>
          <Text style={[s.hGreg, { fontSize: fSmall }]}>{gregRange}</Text>
        </View>

        {/* ── Top-center controls ── */}
        <View style={s.topCenter}>
          <TouchableOpacity style={[s.pill, isToday && s.pillActive]} onPress={goToday}>
            <Text style={[s.pillTxt, isToday && s.pillTxtActive]}>● Bugün</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={toggleDarkMode}>
            <Text style={s.iconTxt}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info panel (top-right) ── */}
        <View style={[s.panelTR, narrow && { maxWidth: width * 0.46 }]}>
          <View style={s.panelCard}>
            <View style={s.panelRow}>
              <View style={s.dayBlock}>
                <Text style={[s.dayNum, { fontSize: fDayNum, lineHeight: fDayNum * 1.05 }]}>{toAr(selD)}</Text>
                <Text style={[s.dayWd, { fontSize: fSmall }]}>{WD[wd]}</Text>
              </View>
              <View style={s.div} />
              <View style={s.detail}>
                <Text style={[s.detMonth, { fontSize: fSub }]}>{MONTHS[viewM - 1].ar} {toAr(viewY)} هـ</Text>
                <Text style={[s.detPhAr, { fontSize: fSmall + 1 }]}>{phaseLabel(selPh).ar}</Text>
                <Text style={[s.detPhEn, { fontSize: fSmall }]}>{phaseLabel(selPh).tr}</Text>
                <Text style={[s.detGreg, { fontSize: fSmall }]}>{sg2} {GM[sg1]} {sg0}</Text>
              </View>
            </View>
            {selEv && (
              <View style={s.evBox}>
                <Text style={[s.evAr, { fontSize: fSub }]}>{selEv.ar}</Text>
                <Text style={[s.evEn, { fontSize: fSmall }]}>{selEv.tr}</Text>
              </View>
            )}
            <TouchableOpacity style={s.noteBtnRow} onPress={() => onDayPress(selD)}>
              <Text style={s.noteBtnTxt}>
                📝 {notes[noteKey(viewY, viewM, selD)] ? 'Notu Düzenle' : 'Not Ekle'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.hintTR, { fontSize: fSmall }]}>AYI ÇEVİRMEK İÇİN SAĞA / SOLA KAYDIRIN</Text>
        </View>

      </View>

      {/* Notes modal */}
      <Modal visible={modalDay != null} transparent animationType="fade" onRequestClose={() => setModalDay(null)}>
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setModalDay(null)}>
              <Text style={s.closeTxt}>×</Text>
            </TouchableOpacity>
            <View style={s.panelRow}>
              <View style={s.dayBlock}>
                <Text style={[s.dayNum, { fontSize: 40, lineHeight: 44 }]}>{modalDay != null ? toAr(Math.min(modalDay, len)) : ''}</Text>
                <Text style={[s.dayWd, { fontSize: FONT_SIZES.small }]}>{WD[wd]}</Text>
              </View>
              <View style={s.div} />
              <View style={s.detail}>
                <Text style={[s.detMonth, { fontSize: FONT_SIZES.medium }]}>{MONTHS[viewM - 1].ar}  {toAr(viewY)} هـ</Text>
                <Text style={[s.detPhAr, { fontSize: FONT_SIZES.small }]}>{phaseLabel(selPh).ar}</Text>
                <Text style={[s.detGreg, { fontSize: FONT_SIZES.small - 1 }]}>{sg2} {GM[sg1]} {sg0}</Text>
              </View>
            </View>

            <View style={s.noteHeaderRow}>
              <Text style={s.noteHeaderAr}>ملاحظات</Text>
              <Text style={s.noteHeaderEn}>NOTLAR</Text>
            </View>
            <TextInput
              style={s.textarea}
              placeholder="Bu gün için bir not yazın…"
              placeholderTextColor={P.muted}
              value={draft}
              onChangeText={setDraft}
              multiline
              textAlignVertical="top"
            />
            <View style={s.modalFooter}>
              <Text style={s.savedHint}>Cihaza kaydedilir</Text>
              <TouchableOpacity style={s.doneBtn} onPress={saveNote}>
                <Text style={s.doneTxt}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (P: Palette) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: P.bg },

  sideArrow:   { position: 'absolute', top: 0, bottom: 0, width: 40, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  sideArrowText:{ fontSize: 36, color: P.goldSoft, opacity: 0.5, lineHeight: 42 },

  // Header (top-left)
  headerTL:    {
    position: 'absolute', top: SPACING.md, left: SPACING.md, zIndex: 10, maxWidth: 360,
    backgroundColor: P.panel,
    borderWidth: 1, borderColor: P.panelBorder,
    borderRadius: 12,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
  },
  kickerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  backBtn:     { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', marginLeft: -6 },
  backArrow:   { fontSize: 28, color: P.goldSoft, lineHeight: 30 },
  kicker:      { color: P.goldSoft, letterSpacing: 3, opacity: 0.85, textTransform: 'uppercase', fontFamily: FONT.cormorant },
  hAr:         { fontWeight: '700', color: P.gold, marginTop: 2, fontFamily: FONT.aref },
  hLa:         { color: P.text, letterSpacing: 0.5, marginTop: 1, fontFamily: FONT.cormorant },
  hGreg:       { color: P.muted, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 3, opacity: 0.9, fontFamily: FONT.cormorant },

  // Top-center controls
  topCenter:   { position: 'absolute', top: SPACING.md, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  pill:        { flexDirection: 'row', alignItems: 'center', backgroundColor: P.panel, borderWidth: 1, borderColor: P.panelBorder, borderRadius: 20, paddingVertical: 6, paddingHorizontal: SPACING.md, marginRight: SPACING.sm },
  pillActive:  { borderColor: P.gold, backgroundColor: `rgba(${P.glowRGB},0.16)` },
  pillTxt:     { color: P.goldSoft, fontSize: FONT_SIZES.small, fontFamily: FONT.cormorant, letterSpacing: 0.5 },
  pillTxtActive:{ color: P.gold },
  iconBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: P.panel, borderWidth: 1, borderColor: P.panelBorder, justifyContent: 'center', alignItems: 'center' },
  iconTxt:     { fontSize: 16 },

  // Info panel (top-right)
  panelTR:     { position: 'absolute', top: SPACING.md, right: SPACING.md, zIndex: 10, alignItems: 'flex-end', maxWidth: 340 },
  panelCard:   { backgroundColor: P.panel, borderWidth: 1, borderColor: P.panelBorder, borderRadius: 6, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}) },
  panelRow:    { flexDirection: 'row', alignItems: 'center' },
  dayBlock:    { alignItems: 'center', minWidth: 50 },
  dayNum:      { fontWeight: '700', color: P.gold, fontFamily: FONT.aref },
  dayWd:       { color: P.muted, marginTop: 3, fontFamily: FONT.amiri },
  div:         { width: 1, alignSelf: 'stretch', backgroundColor: P.line, marginHorizontal: SPACING.md },
  detail:      { flexShrink: 1 },
  detMonth:    { color: P.text, marginBottom: 2, fontFamily: FONT.amiri },
  detPhAr:     { color: P.goldSoft, fontFamily: FONT.amiri },
  detPhEn:     { color: P.muted, fontStyle: 'italic', marginTop: 1, fontFamily: FONT.cormorant },
  detGreg:     { color: P.muted, letterSpacing: 0.8, marginTop: 4, textTransform: 'uppercase', fontFamily: FONT.cormorant },
  evBox:       { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: P.line, alignItems: 'center' },
  evAr:        { color: P.gold, textAlign: 'center', fontFamily: FONT.amiri },
  evEn:        { color: P.text, fontStyle: 'italic', opacity: 0.9, textAlign: 'center', marginTop: 2, fontFamily: FONT.cormorant },
  noteBtnRow:  { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: P.line, alignItems: 'center' },
  noteBtnTxt:  { color: P.goldSoft, fontSize: FONT_SIZES.small, fontFamily: FONT.cormorant },
  hintTR:      { color: P.muted, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.6, marginTop: SPACING.md, textAlign: 'right', fontFamily: FONT.cormorant },

  overlay:     { flex: 1, backgroundColor: 'rgba(4,8,20,0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard:   { width: '100%', maxWidth: 440, backgroundColor: P.panel, borderWidth: 1, borderColor: P.panelBorder, borderRadius: 14, padding: SPACING.lg },
  closeBtn:    { position: 'absolute', top: 8, right: 12, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  closeTxt:    { fontSize: 26, color: P.goldSoft, lineHeight: 28, fontFamily: FONT.cormorant },
  noteHeaderRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  noteHeaderAr:{ fontSize: FONT_SIZES.medium, color: P.goldSoft, fontFamily: FONT.amiri },
  noteHeaderEn:{ fontSize: FONT_SIZES.small - 2, color: P.muted, letterSpacing: 2, fontFamily: FONT.cormorant },
  textarea:    { minHeight: 110, borderWidth: 1, borderColor: P.line, borderRadius: 8, padding: SPACING.md, color: P.text, fontSize: FONT_SIZES.medium, backgroundColor: `rgba(${P.glowRGB},0.06)`, fontFamily: FONT.amiri },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md },
  savedHint:   { fontSize: FONT_SIZES.small - 1, color: P.muted, fontStyle: 'italic', opacity: 0.8, fontFamily: FONT.cormorant },
  doneBtn:     { borderWidth: 1, borderColor: P.panelBorder, borderRadius: 6, paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.lg },
  doneTxt:     { fontSize: FONT_SIZES.small, color: P.gold, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600', fontFamily: FONT.cormorant },
});
