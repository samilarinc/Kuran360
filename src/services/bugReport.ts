import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { collection, addDoc } from 'firebase/firestore';
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

    await addDoc(collection(db, 'bugReports'), {
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
