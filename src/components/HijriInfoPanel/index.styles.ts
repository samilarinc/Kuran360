import { StyleSheet, Platform } from 'react-native';
import { SPACING } from '@/theme';
import { FONT, HijriPalette } from '@/utils/hijriCalendar';

export const createStyles = (P: HijriPalette) => StyleSheet.create({
    panelTR: { position: 'absolute', top: SPACING.md, right: SPACING.md, zIndex: 10, alignItems: 'flex-end' },
    panelCard: {
        backgroundColor: P.panel, borderWidth: 1, borderColor: P.panelBorder, borderRadius: 6,
        paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm,
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
    },
    evBox: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: P.line, alignItems: 'center' },
    evAr: { color: P.gold, textAlign: 'center', fontFamily: FONT.amiri },
    evEn: { color: P.text, fontStyle: 'italic', opacity: 0.9, textAlign: 'center', marginTop: 2, fontFamily: FONT.cormorant },
});
