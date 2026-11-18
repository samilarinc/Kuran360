import React from 'react';
import { Animated, View, Text, TouchableOpacity, Platform } from 'react-native';
import { RING_FONT, HijriPalette, toArabicDigits } from '@/utils/hijriRing';

interface HijriDayGlyphProps {
    P: HijriPalette;
    d: number;
    gx: number;
    gy: number;
    r: number;
    shadowX: number;
    isSel: boolean;
    isToday: boolean;
    centerBright: boolean;
    hasEvent: boolean;
    hasNote: boolean;
    /** Turns the glyph back against the ring's rotation so the moon and number stay upright */
    counterRotate: Animated.AnimatedInterpolation<string>;
    /** 0..1 loop that makes the halo breathe (the special day of tonight or today) */
    pulse?: Animated.Value;
    onPress: () => void;
    onLongPress: () => void;
    onPressOut: () => void;
}

/** One night of the month on the ring: a small moon in that night's phase with the day number */
export const HijriDayGlyph: React.FC<HijriDayGlyphProps> = ({
    P, d, gx, gy, r, shadowX, isSel, isToday, centerBright, hasEvent, hasNote, counterRotate, pulse,
    onPress, onLongPress, onPressOut,
}) => {
    const web = Platform.OS === 'web';
    // Special days (kandils, bayrams…) get a gilded halo around the moon so they stand out on the ring
    const haloR = r * 1.55;
    const lit = isSel || isToday;

    return (
        <>
            {hasEvent && (
                <Animated.View pointerEvents="none" style={[
                    {
                        position: 'absolute', left: gx - haloR, top: gy - haloR,
                        width: haloR * 2, height: haloR * 2, borderRadius: haloR,
                        borderWidth: 1.2, borderColor: P.gold,
                        backgroundColor: `rgba(${P.glowRGB},0.14)`,
                    },
                    web
                        ? ({ boxShadow: `0 0 ${r * 1.6}px rgba(${P.glowRGB},0.75), inset 0 0 ${r * 0.8}px rgba(${P.glowRGB},0.45)` } as any)
                        : { shadowColor: P.gold, shadowOpacity: 0.9, shadowRadius: r * 1.2, shadowOffset: { width: 0, height: 0 } },
                    pulse && {
                        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.18] }) }],
                    },
                ]} />
            )}
            <Animated.View style={{
                position: 'absolute', left: gx - r, top: gy - r, width: r * 2, height: r * 2,
                transform: [{ rotate: counterRotate }],
            }}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    onPressOut={onPressOut}
                    delayLongPress={350}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    style={[
                        {
                            width: r * 2, height: r * 2, borderRadius: r,
                            backgroundColor: P.moonIvory, overflow: 'hidden',
                            borderWidth: isSel ? 1.5 : isToday ? 1 : 0,
                            borderColor: isSel ? P.gold : P.goldSoft,
                            justifyContent: 'center', alignItems: 'center',
                        },
                        isSel && (web
                            ? ({ boxShadow: `0 0 ${r * 1.8}px rgba(${P.glowRGB},0.85), 0 0 ${r}px rgba(${P.glowRGB},0.5)` } as any)
                            : { shadowColor: P.gold, shadowOpacity: 0.85, shadowRadius: r, shadowOffset: { width: 0, height: 0 }, elevation: 8 }),
                        !isSel && isToday && (web
                            ? ({ boxShadow: `0 0 ${r * 1.4}px rgba(${P.glowRGB},0.6)` } as any)
                            : { shadowColor: P.goldSoft, shadowOpacity: 0.55, shadowRadius: r * 0.7, shadowOffset: { width: 0, height: 0 }, elevation: 4 }),
                    ]}
                >
                    {/* Moon shadow */}
                    <View style={[
                        { position: 'absolute', width: r * 2, height: r * 2, borderRadius: r, backgroundColor: P.moonDark, transform: [{ translateX: shadowX }] },
                        web ? ({ filter: 'blur(0.8px)' } as any) : {},
                    ]} />
                    <Text style={{
                        position: 'absolute',
                        fontSize: Math.max(7, r * (d >= 10 ? 0.56 : 0.72)),
                        lineHeight: Math.max(8, r * (d >= 10 ? 0.62 : 0.78)),
                        color: lit ? P.gold : centerBright ? P.moonDark : P.moonIvory,
                        fontFamily: lit ? RING_FONT.naskhBold : RING_FONT.naskh,
                        textAlign: 'center',
                        ...(web && lit ? ({ textShadow: `0 0 6px rgba(${P.glowRGB},1), 0 0 3px rgba(0,0,0,0.8)` } as any) : {}),
                    }}>{toArabicDigits(d)}</Text>
                    {/* Note dot at bottom-right of disk */}
                    {hasNote && (
                        <View style={{
                            position: 'absolute', right: r * 0.12, bottom: r * 0.12,
                            width: r * 0.28, height: r * 0.28, borderRadius: 99,
                            backgroundColor: P.goldSoft,
                        }} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        </>
    );
};
