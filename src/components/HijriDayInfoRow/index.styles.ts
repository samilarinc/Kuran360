import { StyleSheet } from 'react-native';
import { SPACING } from '@/theme';
import { FONT, HijriPalette } from '@/utils/hijriCalendar';

export const createStyles = (P: HijriPalette) => StyleSheet.create({
    panelRow: { flexDirection: 'row', alignItems: 'center' },
    dayBlock: { alignItems: 'center', minWidth: 44 },
    dayNum: { fontWeight: '700', color: P.gold, fontFamily: FONT.aref },
    dayWd: { color: P.muted, marginTop: 2, fontFamily: FONT.amiri },
    div: { width: 1, alignSelf: 'stretch', backgroundColor: P.line, marginHorizontal: SPACING.sm },
    detail: { flexShrink: 1 },
    detMonth: { color: P.text, marginBottom: 2, fontFamily: FONT.amiri },
    detPhAr: { color: P.goldSoft, fontFamily: FONT.amiri },
    detGreg: { color: P.muted, letterSpacing: 0.8, marginTop: 4, textTransform: 'uppercase', fontFamily: FONT.cormorant },
});
