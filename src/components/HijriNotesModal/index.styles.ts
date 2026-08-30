import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZES } from '@/theme';
import { FONT, HijriPalette } from '@/utils/hijriCalendar';

export const createStyles = (P: HijriPalette) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(4,8,20,0.65)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md },
    modalCard: { width: '100%', maxWidth: 600, backgroundColor: P.panel, borderWidth: 1, borderColor: P.panelBorder, borderRadius: 16, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: P.line },
    closeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    closeTxt: { fontSize: 28, color: P.goldSoft, lineHeight: 30, fontFamily: FONT.cormorant },
    newNoteBox: { margin: SPACING.md, borderWidth: 1, borderColor: P.line, borderRadius: 10, backgroundColor: `rgba(${P.glowRGB},0.05)`, overflow: 'hidden' },
    newNoteBoxFocused: { borderColor: P.goldSoft },
    textarea: { padding: SPACING.md, color: P.text, fontSize: FONT_SIZES.medium, lineHeight: FONT_SIZES.medium * 1.65, fontFamily: FONT.amiri },
    newNoteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, paddingTop: 4 },
    savedHint: { fontSize: FONT_SIZES.small - 1, color: P.muted, fontStyle: 'italic', opacity: 0.8, fontFamily: FONT.cormorant },
    addBtn: { borderWidth: 1, borderColor: P.gold, borderRadius: 6, paddingVertical: 5, paddingHorizontal: SPACING.md },
    addBtnTxt: { fontSize: FONT_SIZES.small, color: P.gold, letterSpacing: 1.5, fontWeight: '600', fontFamily: FONT.cormorant },
    notesList: { maxHeight: 340, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
    stickyNote: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: `rgba(${P.glowRGB},0.10)`, borderLeftWidth: 3, borderLeftColor: P.goldSoft, borderRadius: 6, padding: SPACING.sm, marginBottom: SPACING.sm },
    stickyTxt: { flex: 1, color: P.text, fontSize: FONT_SIZES.medium, lineHeight: FONT_SIZES.medium * 1.5, fontFamily: FONT.amiri },
    stickyDel: { paddingLeft: SPACING.sm, justifyContent: 'center' },
    stickyDelTxt: { fontSize: 20, color: P.muted, lineHeight: 22, opacity: 0.7 },
    emptyNotes: { padding: SPACING.lg, alignItems: 'center' },
    emptyNotesTxt: { color: P.muted, fontStyle: 'italic', fontFamily: FONT.cormorant, fontSize: FONT_SIZES.small },
});
