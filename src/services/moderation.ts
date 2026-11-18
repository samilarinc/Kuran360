import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';

/**
 * Moderation for content other users publish (public hatims), as App Store guideline 1.2 requires:
 * accepting the community rules before publishing, reporting content and blocking its author.
 * Blocks are kept on the device; reports go to Firestore for the admin.
 */

const BLOCKED_USERS_KEY = 'moderation.blockedUsers';
const RULES_ACCEPTED_KEY = 'moderation.communityRulesAccepted';
const REPORTS_COLLECTION = 'contentReports';

export type ReportTarget = { type: 'hatim'; id: string; ownerId: string; title: string };

export const getBlockedUsers = async (): Promise<string[]> => {
    try {
        const raw = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const blockUser = async (uid: string): Promise<void> => {
    const blocked = await getBlockedUsers();
    if (!blocked.includes(uid)) await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify([...blocked, uid]));
};

export const reportContent = (target: ReportTarget): Promise<unknown> =>
    // Limits match the contentReports rule in firestore.rules
    addDoc(collection(db, REPORTS_COLLECTION), {
        type: target.type,
        targetId: target.id,
        ownerId: target.ownerId,
        title: target.title.slice(0, 200),
        reporterId: auth.currentUser?.uid ?? '',
        status: 'new',
        createdAt: Date.now(),
    });

export const hasAcceptedCommunityRules = async (): Promise<boolean> =>
    (await AsyncStorage.getItem(RULES_ACCEPTED_KEY).catch(() => null)) === '1';

export const acceptCommunityRules = () => AsyncStorage.setItem(RULES_ACCEPTED_KEY, '1');
