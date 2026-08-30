import { StyleSheet, Platform } from 'react-native';
import { SPACING, FONT_SIZES } from '@/theme';
import { FONT, HijriPalette } from '@/utils/hijriCalendar';

export const createStyles = (P: HijriPalette) => StyleSheet.create({
    todayBtn: {
        position: 'absolute', bottom: SPACING.lg, alignSelf: 'center', backgroundColor: P.panel,
        borderWidth: 1, borderColor: P.gold, borderRadius: 24,
        paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xl, zIndex: 10,
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
    },
    todayBtnTxt: { color: P.gold, fontSize: FONT_SIZES.small, letterSpacing: 1.5, fontFamily: FONT.cormorant, fontWeight: '600' },
});
