import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getRecentLogs } from '@/services/logBuffer';
import { AppSettings } from '@/types';

// Same limits as the bugReports rule in firestore.rules
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 200;
const MAX_SETTINGS_LENGTH = 4000;
const MAX_LOGS_LENGTH = 16000;

const clip = (value: string, max: number) => (value.length > max ? value.slice(0, max) : value);

const BUG_REPORTS_COLLECTION = 'bugReports';
const LIST_LIMIT = 200;

export type BugReportStatus = 'new' | 'resolved';

export interface BugReport {
    id: string;
    message: string;
    name: string;
    email: string;
    uid: string;
    screen: string;
    platform: string;
    osVersion: string;
    deviceModel: string;
    appVersion: string;
    language: string;
    settings: string;
    logs: string;
    status: BugReportStatus;
    createdAt: number;
}

export interface BugReportInput {
    message: string;
    name: string;
    email: string;
    uid: string | null;
    screen: string;
    language: string;
    settings: AppSettings;
}

const getDeviceModel = (): string => {
    const constants: any = Platform.constants ?? {};
    if (Platform.OS === 'android') return [constants.Brand, constants.Model].filter(Boolean).join(' ');
    if (Platform.OS === 'ios') return constants.interfaceIdiom ?? '';
    const nav: any = (globalThis as any).navigator;
    return nav?.userAgent ?? '';
};

export const submitBugReport = async (input: BugReportInput) => {
    // The prayer location says where the user lives; it doesn't help with a bug
    const settings: Partial<AppSettings> = { ...input.settings };
    delete settings.prayerLocation;

    await addDoc(collection(db, BUG_REPORTS_COLLECTION), {
        message: clip(input.message.trim(), MAX_MESSAGE_LENGTH),
        name: clip(input.name.trim(), MAX_NAME_LENGTH),
        email: clip(input.email.trim(), MAX_EMAIL_LENGTH),
        uid: input.uid ?? '',
        screen: clip(input.screen, 100),
        platform: Platform.OS,
        osVersion: clip(String(Platform.Version ?? ''), 50),
        deviceModel: clip(getDeviceModel(), 300),
        appVersion: clip(Constants.expoConfig?.version ?? '', 50),
        language: clip(input.language, 10),
        settings: clip(JSON.stringify(settings), MAX_SETTINGS_LENGTH),
        // Keep the newest lines if the buffer is over the limit
        logs: getRecentLogs().slice(-MAX_LOGS_LENGTH),
        status: 'new',
        createdAt: Date.now(),
    });
};

// Admin only (see firestore.rules): newest first
export const fetchBugReports = async (): Promise<BugReport[]> => {
    const snapshot = await getDocs(query(collection(db, BUG_REPORTS_COLLECTION), orderBy('createdAt', 'desc'), limit(LIST_LIMIT)));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BugReport));
};

export const setBugReportStatus = (id: string, status: BugReportStatus) =>
    updateDoc(doc(db, BUG_REPORTS_COLLECTION, id), { status });

export const deleteBugReport = (id: string) => deleteDoc(doc(db, BUG_REPORTS_COLLECTION, id));
