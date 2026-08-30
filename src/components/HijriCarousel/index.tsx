import React from 'react';
import { View, Animated } from 'react-native';
import { HijriPalette, P_IN, STAGES } from '@/utils/hijriCalendar';
import { HijriMoonDisk } from '@/components/HijriMoonDisk';
import { HijriDayGlyph } from '@/components/HijriDayGlyph';

interface DayGeometry {
    d: number;
    lx: number;
    ly: number;
    shadowX: number;
    illum: number;
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
}

export const HijriCarousel: React.FC<HijriCarouselProps> = ({
    P, dragP, daysAnim, cx, cy, outerR, moonR, glyphR, vmin, days, selPh, sidePhase,
    selDay, isDayToday, hasEvent, hasNote, onDayPress,
}) => {
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

    return (
        <>
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
                        <View style={{ position: 'absolute', left: outerR - moonR, top: outerR - moonR }}>
                            <HijriMoonDisk r={moonR} phase={isCenter ? selPh : sidePhase(off)} P={P} glow={isCenter} dim={!isCenter} />
                        </View>

                        {isCenter && (
                            <Animated.View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width: outerR * 2, height: outerR * 2, opacity: daysAnim }}>
                                {days.map(({ d, lx, ly, shadowX, illum }) => {
                                    const dayIsToday = isDayToday(d);
                                    const isSel = d === selDay;
                                    const r = isSel ? glyphR * 1.32 : dayIsToday ? glyphR * 1.12 : glyphR;
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
                                            hasEvent={hasEvent(d)}
                                            hasNote={hasNote(d)}
                                            onPress={() => onDayPress(d)}
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
