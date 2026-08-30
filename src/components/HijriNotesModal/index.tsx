import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { FONT_SIZES } from '@/theme';
import { HijriPalette, HijriNoteEntry } from '@/utils/hijriCalendar';
import { HijriDayInfoRow } from '@/components/HijriDayInfoRow';
import { createStyles } from './index.styles';

interface HijriNotesModalProps {
    P: HijriPalette;
    visible: boolean;
    height: number;
    narrow: boolean;
    lang: 'tr' | 'ar';
    dayLabel: string;
    weekdayLabel: string;
    monthLabel: string;
    phaseLabel: string;
    gregLabel: string;
    notes: HijriNoteEntry[];
    draft: string;
    draftFocused: boolean;
    onChangeDraft: (text: string) => void;
    onFocusDraft: () => void;
    onBlurDraft: () => void;
    onAddNote: () => void;
    onDeleteNote: (id: string) => void;
    onClose: () => void;
}

export const HijriNotesModal: React.FC<HijriNotesModalProps> = ({
    P, visible, height, narrow, lang,
    dayLabel, weekdayLabel, monthLabel, phaseLabel, gregLabel,
    notes, draft, draftFocused,
    onChangeDraft, onFocusDraft, onBlurDraft, onAddNote, onDeleteNote, onClose,
}) => {
    const s = useMemo(() => createStyles(P), [P]);

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
                            placeholder={lang === 'tr' ? 'Yeni not ekle…' : 'أضف ملاحظة جديدة…'}
                            placeholderTextColor={P.muted}
                            value={draft}
                            onChangeText={onChangeDraft}
                            onFocus={onFocusDraft}
                            onBlur={onBlurDraft}
                            multiline
                            textAlignVertical="top"
                        />
                        {(draftFocused || draft.length > 0) && (
                            <View style={s.newNoteFooter}>
                                <Text style={s.savedHint}>{lang === 'tr' ? 'Cihaza kaydedilir' : 'يحفظ على الجهاز'}</Text>
                                <TouchableOpacity style={s.addBtn} onPress={onAddNote}>
                                    <Text style={s.addBtnTxt}>{lang === 'tr' ? '+ EKLE' : '+ أضف'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {notes.length === 0 ? (
                        <View style={s.emptyNotes}>
                            <Text style={s.emptyNotesTxt}>
                                {lang === 'tr' ? 'Henüz not yok' : 'لا توجد ملاحظات بعد'}
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
