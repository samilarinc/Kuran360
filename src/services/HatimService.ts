import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    deleteDoc,
    where,
    or,
    runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { Hatim, HatimPart } from '@/types';

const HATIMS_COLLECTION = 'hatims';

/** Error whose message is an i18n key under `hatimErrors`, so screens can show it translated. */
export class HatimError extends Error {
    constructor(code: 'notFound' | 'locked' | 'alreadyClaimed' | 'notYourPart') {
        super(`hatimErrors.${code}`);
    }
}

/**
 * Reads the hatim and writes its updated parts in one transaction, so two people changing
 * different parts at the same time don't overwrite each other's claims.
 */
const updatePartsInTransaction = (
    hatimId: string,
    update: (hatim: Hatim) => { parts: HatimPart[]; extra?: Record<string, unknown> } | null,
): Promise<void> =>
    runTransaction(db, async transaction => {
        const docRef = doc(db, HATIMS_COLLECTION, hatimId);
        const snap = await transaction.get(docRef);
        if (!snap.exists()) throw new HatimError('notFound');
        const result = update({ id: snap.id, ...snap.data() } as Hatim);
        if (result) transaction.update(docRef, { parts: result.parts, ...result.extra });
    });

const updatePart = (hatimId: string, partNumber: number, change: (part: HatimPart, hatim: Hatim) => HatimPart) =>
    updatePartsInTransaction(hatimId, hatim => {
        if (hatim.isLocked) throw new HatimError('locked');
        const parts = hatim.parts.map(part => (part.partNumber === partNumber ? change(part, hatim) : part));
        return { parts, extra: { isCompleted: parts.every(p => p.isCompleted) } };
    });

export const HatimService = {
    async createHatim(title: string, description: string, creatorId: string, creatorName: string, deadline?: number, isPrivate: boolean = false): Promise<string> {
        const parts: HatimPart[] = Array.from({ length: 30 }, (_, i) => {
            const partNumber = i + 1;
            let totalPages = 20;
            if (partNumber === 1) totalPages = 21;
            if (partNumber === 30) totalPages = 23;

            return {
                partNumber,
                claimedById: null,
                claimedByName: null,
                claimedAt: 0,
                isCompleted: false,
                completedAt: 0,
                pagesRead: 0,
                totalPages
            };
        });

        const hatimData = {
            title,
            description,
            creatorId,
            creatorName,
            createdAt: Date.now(),
            parts,
            isCompleted: false,
            deadline: deadline || null,
            isPrivate,
            isLocked: false
        };

        const docRef = await addDoc(collection(db, HATIMS_COLLECTION), hatimData);
        return docRef.id;
    },

    async getHatims(userId?: string): Promise<Hatim[]> {
        const ADMIN_ID = 'REMOVED_ADMIN_UID';
        let q;

        if (userId === ADMIN_ID) {
            // Admin can see everything
            q = query(collection(db, HATIMS_COLLECTION));
        } else if (userId) {
            // Logged in users can see public hatims and their own hatims
            // We use an 'or' query to satisfy security rules while getting both types
            q = query(
                collection(db, HATIMS_COLLECTION),
                or(
                    where('isPrivate', '==', false),
                    where('creatorId', '==', userId)
                )
            );
        } else {
            // Guests only see public hatims
            q = query(collection(db, HATIMS_COLLECTION), where('isPrivate', '==', false));
        }

        const querySnapshot = await getDocs(q);
        const allHatims = querySnapshot.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            ...docSnapshot.data()
        } as Hatim));

        // We sort in memory to avoid requiring composite indexes for (isPrivate, createdAt) or (creatorId, createdAt)
        return allHatims.sort((a: Hatim, b: Hatim) => (b.createdAt || 0) - (a.createdAt || 0));
    },

    async getHatimById(id: string): Promise<Hatim | null> {
        const docRef = doc(db, HATIMS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Hatim;
        }
        return null;
    },

    claimPart(hatimId: string, partNumber: number, userId: string, userName: string): Promise<void> {
        return updatePart(hatimId, partNumber, part => {
            if (part.claimedById && part.claimedById !== userId) throw new HatimError('alreadyClaimed');
            return { ...part, claimedById: userId, claimedByName: userName, claimedAt: Date.now() };
        });
    },

    unclaimPart(hatimId: string, partNumber: number, userId: string): Promise<void> {
        return updatePart(hatimId, partNumber, (part, hatim) => {
            if (part.claimedById !== userId && hatim.creatorId !== userId) throw new HatimError('notYourPart');
            return { ...part, claimedById: null, claimedByName: null, claimedAt: 0, isCompleted: false, completedAt: 0 };
        });
    },

    togglePartCompletion(hatimId: string, partNumber: number, userId: string, completed: boolean): Promise<void> {
        return updatePart(hatimId, partNumber, (part, hatim) => {
            // Allow creator or the person who claimed it to toggle completion
            if (part.claimedById !== userId && hatim.creatorId !== userId) throw new HatimError('notYourPart');
            return { ...part, isCompleted: completed, completedAt: completed ? Date.now() : 0 };
        });
    },

    updatePartProgress(hatimId: string, partNumber: number, userId: string, pagesRead: number): Promise<void> {
        return updatePart(hatimId, partNumber, (part, hatim) => {
            if (part.claimedById !== userId && hatim.creatorId !== userId) throw new HatimError('notYourPart');
            const completed = pagesRead >= (part.totalPages || 20);
            return { ...part, pagesRead, isCompleted: completed, completedAt: completed ? Date.now() : 0 };
        });
    },

    async syncUserName(hatimId: string, userId: string, newName: string): Promise<void> {
        await updatePartsInTransaction(hatimId, hatim => {
            let changed = false;
            const parts = hatim.parts.map(part => {
                if (part.claimedById === userId && part.claimedByName !== newName) {
                    changed = true;
                    return { ...part, claimedByName: newName };
                }
                return part;
            });
            const renameCreator = hatim.creatorId === userId && hatim.creatorName !== newName;
            if (!changed && !renameCreator) return null;
            return { parts, extra: renameCreator ? { creatorName: newName } : undefined };
        }).catch(error => {
            // Deleted meanwhile: nothing to sync
            if (!(error instanceof HatimError)) throw error;
        });
    },

    async updateHatim(hatimId: string, updates: { title?: string; description?: string; deadline?: number | null; isPrivate?: boolean; isLocked?: boolean }): Promise<void> {
        const docRef = doc(db, HATIMS_COLLECTION, hatimId);
        await updateDoc(docRef, updates);
    },

    async deleteHatim(hatimId: string): Promise<void> {
        const docRef = doc(db, HATIMS_COLLECTION, hatimId);
        await deleteDoc(docRef);
    }
};
