import React from 'react';
import { View, Platform } from 'react-native';
import { HijriPalette } from '@/utils/hijriCalendar';

interface HijriMoonDiskProps {
    r: number;
    phase: { illum: number; wax: boolean };
    P: HijriPalette;
    glow?: boolean;
    dim?: boolean;
}

export const HijriMoonDisk: React.FC<HijriMoonDiskProps> = ({ r, phase, P, glow, dim }) => {
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
