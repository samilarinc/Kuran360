import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HijriNoteEntry } from '@/utils/hijriCalendar';

const NOTES_KEY = 'hijri-cal-notes';

export type NotesByDay = Record<string, HijriNoteEntry[]>;

export const hijriNoteKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

/** Parses stored notes; early versions kept a single string per day instead of a list */
const parseNotes = (raw: string | null): NotesByDay => {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) || {};
        const notes: NotesByDay = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof value === 'string') notes[key] = [{ id: `${key}-0`, text: value, ts: 0 }];
            else if (Array.isArray(value)) notes[key] = value as HijriNoteEntry[];
        }
        return notes;
    } catch {
        return {};
    }
};

/** Per-day notes of the Hijri calendar, kept on the device */
export const useHijriNotes = () => {
    const [notes, setNotes] = useState<NotesByDay>({});

    useEffect(() => {
        AsyncStorage.getItem(NOTES_KEY).then(raw => setNotes(parseNotes(raw))).catch(() => { });
    }, []);

    const update = useCallback((change: (prev: NotesByDay) => NotesByDay) => {
        setNotes(prev => {
            const next = change(prev);
            AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next)).catch(() => { });
            return next;
        });
    }, []);

    const addNote = useCallback((key: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const entry: HijriNoteEntry = { id: Date.now().toString(), text: trimmed, ts: Date.now() };
        update(prev => ({ ...prev, [key]: [...(prev[key] || []), entry] }));
    }, [update]);

    const deleteNote = useCallback((key: string, id: string) => {
        update(prev => {
            const remaining = (prev[key] || []).filter(n => n.id !== id);
            const next = { ...prev };
            if (remaining.length) next[key] = remaining; else delete next[key];
            return next;
        });
    }, [update]);

    return { notes, addNote, deleteNote };
};
