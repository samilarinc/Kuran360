import React from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HijriPalette, DRAG_STOPS, CAROUSEL_OFFSETS, RING_FONT } from '@/utils/hijriRing';
import { HijriMoonDisk } from '@/components/HijriMoonDisk';
import { HijriDayGlyph } from '@/components/HijriDayGlyph';

interface DayGeometry {
    d: number;
    lx: number;
    ly: number;
    shadowX: number;
    illum: number;
}

/** A gilded stretch of the ring between two days, e.g. from today to the next special day */
export interface RingArc {
    from: number;
    to: number;
    /** Shown just inside the ring at the arc's end ("12 gün") */
    label?: string;
}

interface HijriCarouselProps {
    P: HijriPalette;
    dragP: Animated.Value;
    daysAnim: Animated.Value;
    cx: number;
    cy: number;
    outerR: number;
    moonR: number;
    glyphR: number;
    vmin: number;
    days: DayGeometry[];
    selPh: { illum: number; wax: boolean };
    sidePhase: (off: number) => { illum: number; wax: boolean };
    selDay: number;
    isDayToday: (d: number) => boolean;
    hasEvent: (d: number) => boolean;
    hasNote: (d: number) => boolean;
    onDayPress: (d: number) => void;
    onDayLongPress: (d: number) => void;
    onDayPressOut: () => void;
    /** The ring's turn in degrees (negative turns it counter-clockwise), so the selected day sits at the top */
    rotation: Animated.Value;
    arc?: RingArc;
    /** The day whose halo breathes, with the 0..1 loop that drives it */
    pulseDay?: number;
    pulse?: Animated.Value;
    ringR: number;
}

/** Point on the ring for an angle measured clockwise from the top */
const ringPoint = (c: number, radius: number, angle: number) => ({ x: c + radius * Math.sin(angle), y: c - radius * Math.cos(angle) });

export const HijriCarousel: React.FC<HijriCarouselProps> = ({
    P, dragP, daysAnim, cx, cy, outerR, moonR, glyphR, vmin, days, selPh, sidePhase,
    selDay, isDayToday, hasEvent, hasNote, onDayPress, onDayLongPress, onDayPressOut,
    rotation, arc, pulseDay, pulse, ringR,
}) => {
    const ringRotate = rotation.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });
    const counterRotate = rotation.interpolate({ inputRange: [-360, 360], outputRange: ['360deg', '-360deg'] });

    const len = days.length;
    const dayAngle = (d: number) => ((d - 1) / len) * 2 * Math.PI;
    let arcPath: string | undefined;
    let labelPoint: { x: number; y: number } | undefined;
    if (arc && arc.to > arc.from) {
        const a1 = dayAngle(arc.from);
        const a2 = dayAngle(arc.to);
        const p1 = ringPoint(outerR, ringR, a1);
        const p2 = ringPoint(outerR, ringR, a2);
        arcPath = `M ${p1.x} ${p1.y} A ${ringR} ${ringR} 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${p2.x} ${p2.y}`;
        if (arc.label) labelPoint = ringPoint(outerR, ringR - glyphR * 3.6, a2);
    }

    const theta = (e: number) => Math.max(-1.45, Math.min(1.45, e * 0.92));
    const stageStyle = (off: number) => ({
        opacity: dragP.interpolate({ inputRange: DRAG_STOPS, outputRange: DRAG_STOPS.map(p => Math.pow(Math.max(0, Math.cos(theta(off - p))), 1.7)) }),
        transform: [
            { perspective: 1700 },
            { translateX: dragP.interpolate({ inputRange: DRAG_STOPS, outputRange: DRAG_STOPS.map(p => Math.sin(theta(off - p)) * 47 * vmin) }) },
            { scale: dragP.interpolate({ inputRange: DRAG_STOPS, outputRange: DRAG_STOPS.map(p => 0.4 + 0.6 * Math.max(0, Math.cos(theta(off - p)))) }) },
            { rotateY: dragP.interpolate({ inputRange: DRAG_STOPS, outputRange: DRAG_STOPS.map(p => `${(-Math.sin(theta(off - p)) * 38).toFixed(2)}deg`) }) },
        ],
    });

    return (
        <>
            {CAROUSEL_OFFSETS.map(off => {
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
                        <View style={{ position: 'absolute', left: outerR - moonR, top: outerR - moonR }}>
                            <HijriMoonDisk r={moonR} phase={isCenter ? selPh : sidePhase(off)} P={P} glow={isCenter} dim={!isCenter} />
                        </View>

                        {isCenter && (
                            <Animated.View
                                pointerEvents="box-none"
                                style={{
                                    position: 'absolute', left: 0, top: 0, width: outerR * 2, height: outerR * 2,
                                    opacity: daysAnim, transform: [{ rotate: ringRotate }],
                                }}
                            >
                                {arcPath && (
                                    <Svg pointerEvents="none" width={outerR * 2} height={outerR * 2} style={{ position: 'absolute', left: 0, top: 0 }}>
                                        <Path d={arcPath} stroke={`rgba(${P.glowRGB},0.25)`} strokeWidth={glyphR * 1.6} strokeLinecap="round" fill="none" />
                                        <Path d={arcPath} stroke={P.gold} strokeWidth={1.6} strokeLinecap="round" fill="none" />
                                    </Svg>
                                )}
                                {labelPoint && (
                                    <Animated.View pointerEvents="none" style={{
                                        position: 'absolute', left: labelPoint.x - 40, top: labelPoint.y - 10, width: 80, height: 20,
                                        alignItems: 'center', justifyContent: 'center', transform: [{ rotate: counterRotate }],
                                    }}>
                                        <Text style={{ color: P.gold, fontSize: Math.max(10, glyphR * 1.05), fontFamily: RING_FONT.latinBold }}>{arc?.label}</Text>
                                    </Animated.View>
                                )}
                                {days.map(({ d, lx, ly, shadowX, illum }) => {
                                    const dayIsToday = isDayToday(d);
                                    const isSel = d === selDay;
                                    const dayHasEvent = hasEvent(d);
                                    const r = isSel ? glyphR * 1.32 : dayIsToday || dayHasEvent ? glyphR * 1.12 : glyphR;
                                    return (
                                        <HijriDayGlyph
                                            key={d}
                                            P={P}
                                            d={d}
                                            gx={outerR + lx}
                                            gy={outerR + ly}
                                            r={r}
                                            shadowX={shadowX}
                                            isSel={isSel}
                                            isToday={dayIsToday}
                                            centerBright={illum >= 0.5}
                                            hasEvent={dayHasEvent}
                                            hasNote={hasNote(d)}
                                            counterRotate={counterRotate}
                                            pulse={d === pulseDay ? pulse : undefined}
                                            onPress={() => onDayPress(d)}
                                            onLongPress={() => onDayLongPress(d)}
                                            onPressOut={onDayPressOut}
                                        />
                                    );
                                })}
                            </Animated.View>
                        )}
                    </Animated.View>
                );
            })}
        </>
    );
};
