import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { FONT, HijriPalette, toAr } from '@/utils/hijriCalendar';

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
    onPress: () => void;
}

export const HijriDayGlyph: React.FC<HijriDayGlyphProps> = ({
    P, d, gx, gy, r, shadowX, isSel, isToday, centerBright, hasEvent, hasNote, onPress,
}) => {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={[
                {
                    position: 'absolute', left: gx - r, top: gy - r,
                    width: r * 2, height: r * 2, borderRadius: r,
                    backgroundColor: P.moonIvory, overflow: 'hidden',
                    borderWidth: isSel ? 1.5 : isToday ? 1 : 0,
                    borderColor: isSel ? P.gold : P.goldSoft,
                    justifyContent: 'center', alignItems: 'center',
                },
                isSel && (Platform.OS === 'web'
                    ? ({ boxShadow: `0 0 ${r * 1.8}px rgba(${P.glowRGB},0.85), 0 0 ${r}px rgba(${P.glowRGB},0.5)` } as any)
                    : ({ shadowColor: P.gold, shadowOpacity: 0.85, shadowRadius: r, shadowOffset: { width: 0, height: 0 }, elevation: 8 })),
                !isSel && isToday && (Platform.OS === 'web'
                    ? ({ boxShadow: `0 0 ${r * 1.4}px rgba(${P.glowRGB},0.6)` } as any)
                    : ({ shadowColor: P.goldSoft, shadowOpacity: 0.55, shadowRadius: r * 0.7, shadowOffset: { width: 0, height: 0 }, elevation: 4 })),
            ]}
        >
            {/* Moon shadow */}
            <View style={[
                { position: 'absolute', width: r * 2, height: r * 2, borderRadius: r, backgroundColor: P.moonDark, transform: [{ translateX: shadowX }] },
                Platform.OS === 'web' ? ({ filter: 'blur(0.8px)' } as any) : {},
            ]} />
            {/* Number centered inside disk */}
            <Text style={{
                position: 'absolute',
                fontSize: Math.max(7, r * (d >= 10 ? 0.56 : 0.72)),
                lineHeight: Math.max(8, r * (d >= 10 ? 0.62 : 0.78)),
                color: isSel || isToday ? P.gold
                    : centerBright ? P.moonDark
                        : P.moonIvory,
                fontWeight: isSel || isToday ? '700' : '600',
                fontFamily: FONT.amiri,
                textAlign: 'center',
                ...(Platform.OS === 'web' && (isSel || isToday)
                    ? ({ textShadow: `0 0 6px rgba(${P.glowRGB},1), 0 0 3px rgba(0,0,0,0.8)` } as any)
                    : {}),
            }}>{toAr(d)}</Text>
            {/* Event / note dot at bottom-right of disk */}
            {(hasEvent || hasNote) && (
                <View style={{
                    position: 'absolute', right: r * 0.12, bottom: r * 0.12,
                    width: r * 0.28, height: r * 0.28, borderRadius: 99,
                    backgroundColor: hasEvent ? P.gold : P.goldSoft,
                    opacity: hasNote && !hasEvent ? 0.7 : 1,
                }} />
            )}
        </TouchableOpacity>
    );
};
