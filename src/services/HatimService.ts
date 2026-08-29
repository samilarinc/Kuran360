import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    orderBy,
    Timestamp,
    setDoc,
    deleteDoc,
    where,
    or
} from 'firebase/firestore';
import { db } from './firebase';
import { Hatim, HatimPart } from '@/types';

const HATIMS_COLLECTION = 'hatims';

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
        const allHatims = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
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

    async claimPart(hatimId: string, partNumber: number, userId: string, userName: string): Promise<void> {
        const hatim = await this.getHatimById(hatimId);
        if (!hatim) throw new Error('Hatim bulunamadı');
        if (hatim.isLocked) throw new Error('Bu hatim kilitlenmiştir, işlem yapılamaz.');

        const updatedParts = hatim.parts.map(part => {
            if (part.partNumber === partNumber) {
                if (part.claimedById && part.claimedById !== userId) {
                    throw new Error('Bu cüz zaten başka biri tarafından alınmış');
                }
                return {
                    ...part,
                    claimedById: userId,
                    claimedByName: userName,
                    claimedAt: Date.now()
                };
            }
            return part;
        });

        const docRef = doc(db, HATIMS_COLLECTION, hatimId);
        await updateDoc(docRef, { parts: updatedParts });
    },

    async unclaimPart(hatimId: string, partNumber: number, userId: string): Promise<void> {
        const hatim = await this.getHatimById(hatimId);
        if (!hatim) throw new Error('Hatim bulunamadı');
        if (hatim.isLocked) throw new Error('Bu hatim kilitlenmiştir, işlem yapılamaz.');

        const isCreator = hatim.creatorId === userId;

        const updatedParts = hatim.parts.map(part => {
            if (part.partNumber === partNumber) {
                if (part.claimedById !== userId && !isCreator) {
                    throw new Error('Sadece kendi aldığınız cüzü veya oluşturduğunuz hatimdeki cüzleri bırakabilirsiniz');
                }
                return {
                    ...part,
                    claimedById: null,
                    claimedByName: null,
                    claimedAt: 0,
                    isCompleted: false,
                    completedAt: 0
                };
            }
            return part;
        });

        const docRef = doc(db, HATIMS_COLLECTION, hatimId);
        await updateDoc(docRef, {
            parts: updatedParts,
            isCompleted: false // Reset hatim completion if a part is unclaimed
        });
    },

    async togglePartCompletion(hatimId: string, partNumber: number, userId: string, completed: boolean): Promise<void> {
        const hatim = await this.getHatimById(hatimId);
        if (!hatim) throw new Error('Hatim bulunamadı');
        if (hatim.isLocked) throw new Error('Bu hatim kilitlenmiştir, işlem yapılamaz.');

        const isCreator = hatim.creatorId === userId;

        const updatedParts = hatim.parts.map(part => {
            if (part.partNumber === partNumber) {
                // Allow creator or the person who claimed it to toggle completion
                if (part.claimedById !== userId && !isCreator) {
                    throw new Error('Sadece kendi aldığınız cüzü tamamlandı yapabilirsiniz');
                }
                return {
                    ...part,
                    isCompleted: completed,
                    completedAt: completed ? Date.now() : 0
                };
            }
            return part;
        });

        const allCompleted = updatedParts.every(p => p.isCompleted);

        const docRef = doc(db, HATIMS_COLLECTION, hatimId);
        await updateDoc(docRef, {
            parts: updatedParts,
            isCompleted: allCompleted
        });
    },

    async updatePartProgress(hatimId: string, partNumber: number, userId: string, pagesRead: number): Promise<void> {
        const hatim = await this.getHatimById(hatimId);
        if (!hatim) throw new Error('Hatim bulunamadı');
        if (hatim.isLocked) throw new Error('Bu hatim kilitlenmiştir, işlem yapılamaz.');

        const isCreator = hatim.creatorId === userId;

        const updatedParts = hatim.parts.map(part => {
            if (part.partNumber === partNumber) {
                if (part.claimedById !== userId && !isCreator) {
                    throw new Error('Sadece kendi aldığınız cüzün ilerlemesini güncelleyebilirsiniz');
                }

                const total = part.totalPages || 20;
                const completed = pagesRead >= total;

                return {
                    ...part,
                    pagesRead,
                    isCompleted: completed,
                    completedAt: completed ? Date.now() : 0
                };
            }
            return part;
        });

        const allCompleted = updatedParts.every(p => p.isCompleted);

        const docRef = doc(db, HATIMS_COLLECTION, hatimId);
        await updateDoc(docRef, {
            parts: updatedParts,
            isCompleted: allCompleted
        });
    },

    async syncUserName(hatimId: string, userId: string, newName: string): Promise<void> {
        const hatim = await this.getHatimById(hatimId);
        if (!hatim) return;

        let changed = false;
        const updatedParts = hatim.parts.map(part => {
            if (part.claimedById === userId && part.claimedByName !== newName) {
                changed = true;
                return { ...part, claimedByName: newName };
            }
            return part;
        });

        // Use a record for updates
        const updates: any = {};
        if (changed) updates.parts = updatedParts;
        if (hatim.creatorId === userId && hatim.creatorName !== newName) {
            updates.creatorName = newName;
        }

        if (Object.keys(updates).length > 0) {
            const docRef = doc(db, HATIMS_COLLECTION, hatimId);
            await updateDoc(docRef, updates);
        }
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
