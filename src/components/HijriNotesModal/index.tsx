import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, StyleSheet } from 'react-native';
import { FONT_SIZES, SPACING } from '@/theme';
import { HijriNoteEntry } from '@/utils/hijriCalendar';
import { HijriPalette, RING_FONT } from '@/utils/hijriRing';
import { HijriDayInfoRow } from '@/components/HijriDayInfoRow';

interface HijriNotesModalProps {
    P: HijriPalette;
    visible: boolean;
    height: number;
    narrow: boolean;
    dayLabel: string;
    weekdayLabel: string;
    monthLabel: string;
    phaseLabel: string;
    gregLabel: string;
    notes: HijriNoteEntry[];
    onAddNote: (text: string) => void;
    onDeleteNote: (id: string) => void;
    onClose: () => void;
}

export const HijriNotesModal: React.FC<HijriNotesModalProps> = ({
    P, visible, height, narrow,
    dayLabel, weekdayLabel, monthLabel, phaseLabel, gregLabel,
    notes, onAddNote, onDeleteNote, onClose,
}) => {
    const { t } = useTranslation();
    const s = useMemo(() => createStyles(P), [P]);
    const [draft, setDraft] = useState('');
    const [draftFocused, setDraftFocused] = useState(false);

    // Every opening starts with an empty, collapsed field
    useEffect(() => {
        if (visible) { setDraft(''); setDraftFocused(false); }
    }, [visible]);

    const add = () => {
        if (!draft.trim()) return;
        onAddNote(draft);
        setDraft('');
        setDraftFocused(false);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={s.overlay}>
                <View style={[s.modalCard, { maxHeight: height * 0.85 }]}>
                    <View style={s.modalHeader}>
                        <HijriDayInfoRow
                            P={P}
                            dayLabel={dayLabel}
                            dayLabelFontSize={narrow ? 34 : 42}
                            dayLabelLineHeight={narrow ? 38 : 46}
                            weekdayLabel={weekdayLabel}
                            weekdayFontSize={FONT_SIZES.small}
                            monthLabel={monthLabel}
                            monthFontSize={FONT_SIZES.medium}
                            phaseLabel={phaseLabel}
                            phaseFontSize={FONT_SIZES.small}
                            gregLabel={gregLabel}
                            gregFontSize={FONT_SIZES.small - 1}
                        />
                        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                            <Text style={s.closeTxt}>×</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[s.newNoteBox, draftFocused && s.newNoteBoxFocused]}>
                        <TextInput
                            style={[s.textarea, { minHeight: draftFocused ? 120 : 44 }]}
                            placeholder={t('hijriCalendar.addNotePlaceholder')}
                            placeholderTextColor={P.muted}
                            value={draft}
                            onChangeText={setDraft}
                            onFocus={() => setDraftFocused(true)}
                            onBlur={() => { if (!draft.trim()) setDraftFocused(false); }}
                            multiline
                            textAlignVertical="top"
                        />
                        {(draftFocused || draft.length > 0) && (
                            <View style={s.newNoteFooter}>
                                <Text style={s.savedHint}>{t('hijriCalendar.savedOnDevice')}</Text>
                                <TouchableOpacity style={s.addBtn} onPress={add}>
                                    <Text style={s.addBtnTxt}>{`+ ${t('hijriCalendar.add')}`}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {notes.length === 0 ? (
                        <View style={s.emptyNotes}>
                            <Text style={s.emptyNotesTxt}>
                                {t('hijriCalendar.noNotes')}
                            </Text>
                        </View>
                    ) : (
                        <ScrollView style={s.notesList} showsVerticalScrollIndicator={false}>
                            {[...notes].reverse().map(note => (
                                <View key={note.id} style={s.stickyNote}>
                                    <Text style={s.stickyTxt} selectable>{note.text}</Text>
                                    <TouchableOpacity style={s.stickyDel} onPress={() => onDeleteNote(note.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Text style={s.stickyDelTxt}>×</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (P: HijriPalette) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(4,8,20,0.65)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md },
    modalCard: { width: '100%', maxWidth: 600, backgroundColor: P.panel, borderWidth: 1, borderColor: P.panelBorder, borderRadius: 16, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: P.line },
    closeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    closeTxt: { fontSize: 28, color: P.goldSoft, lineHeight: 30, fontFamily: RING_FONT.latin },
    newNoteBox: { margin: SPACING.md, borderWidth: 1, borderColor: P.line, borderRadius: 10, backgroundColor: `rgba(${P.glowRGB},0.05)`, overflow: 'hidden' },
    newNoteBoxFocused: { borderColor: P.goldSoft },
    textarea: { padding: SPACING.md, color: P.text, fontSize: FONT_SIZES.medium, lineHeight: FONT_SIZES.medium * 1.65, fontFamily: RING_FONT.naskh },
    newNoteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, paddingTop: 4 },
    savedHint: { fontSize: FONT_SIZES.small - 1, color: P.muted, fontStyle: 'italic', opacity: 0.8, fontFamily: RING_FONT.latin },
    addBtn: { borderWidth: 1, borderColor: P.gold, borderRadius: 6, paddingVertical: 5, paddingHorizontal: SPACING.md },
    addBtnTxt: { fontSize: FONT_SIZES.small, color: P.gold, letterSpacing: 1.5, fontFamily: RING_FONT.latinBold },
    notesList: { maxHeight: 340, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
    stickyNote: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: `rgba(${P.glowRGB},0.10)`, borderLeftWidth: 3, borderLeftColor: P.goldSoft, borderRadius: 6, padding: SPACING.sm, marginBottom: SPACING.sm },
    stickyTxt: { flex: 1, color: P.text, fontSize: FONT_SIZES.medium, lineHeight: FONT_SIZES.medium * 1.5, fontFamily: RING_FONT.naskh },
    stickyDel: { paddingLeft: SPACING.sm, justifyContent: 'center' },
    stickyDelTxt: { fontSize: 20, color: P.muted, lineHeight: 22, opacity: 0.7 },
    emptyNotes: { padding: SPACING.lg, alignItems: 'center' },
    emptyNotesTxt: { color: P.muted, fontStyle: 'italic', fontFamily: RING_FONT.latin, fontSize: FONT_SIZES.small },
});
