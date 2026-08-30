import { StyleSheet, Platform } from 'react-native';
import { SPACING } from '@/theme';
import { FONT, HijriPalette } from '@/utils/hijriCalendar';

export const createStyles = (P: HijriPalette) => StyleSheet.create({
    headerTL: {
        position: 'absolute', top: SPACING.md, left: SPACING.md, zIndex: 10,
        backgroundColor: P.panel,
        borderWidth: 1, borderColor: P.panelBorder,
        borderRadius: 12,
        paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm,
        alignItems: 'center',
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
    },
    hAr: { fontWeight: '700', color: P.gold, marginTop: 6, fontFamily: FONT.aref, textAlign: 'center' },
    hLa: { color: P.text, letterSpacing: 0.5, marginTop: 3, fontFamily: FONT.cormorant, textAlign: 'center' },
    hGreg: { color: P.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3, opacity: 0.9, fontFamily: FONT.cormorant, textAlign: 'center' },
});
