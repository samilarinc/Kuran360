import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MemorizationAttempt } from '@/components/MemorizationSummary';
import type { MemorizationSelection } from '@/components/SurahVersePickerModal';

const STORAGE_KEY = 'memorization_session';

/** Where the memorization screen was left, so it opens there again. */
export interface SavedMemorizationSession {
    selection: MemorizationSelection;
    verseNumber: number;
    queue: number[];
    attempts: Record<number, MemorizationAttempt>;
    finished: boolean;
    autoAdvance: boolean;
}

export const loadMemorizationSession = async (): Promise<Partial<SavedMemorizationSession> | null> => {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const saveMemorizationSession = (session: SavedMemorizationSession) =>
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session)).catch(() => { });
