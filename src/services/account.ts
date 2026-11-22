import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';

const HATIMS_COLLECTION = 'hatims';

/**
 * Deletes everything stored for a user before their auth account is removed (App Store guideline 5.1.1(v)):
 * profile, synced data and settings, received dua requests and the hatims they created.
 * Bug reports stay (only the admin may delete them) and parts claimed in others' hatims keep the name shown there.
 */
export const deleteUserData = async (uid: string): Promise<void> => {
    const requests = await getDocs(collection(db, 'users', uid, 'duaRequests'));
    const hatims = await getDocs(query(collection(db, HATIMS_COLLECTION), where('creatorId', '==', uid)));
    await Promise.all([
        ...requests.docs.map(d => deleteDoc(d.ref)),
        ...hatims.docs.map(d => deleteDoc(d.ref)),
        deleteDoc(doc(db, 'users', uid, 'data', 'userData')),
        deleteDoc(doc(db, 'users', uid, 'meta', 'settings')),
        deleteDoc(doc(db, 'users', uid, 'profile', 'info')),
        deleteDoc(doc(db, 'users', uid, 'profile', 'public')),
    ]);
    await deleteDoc(doc(db, 'users', uid));
};
