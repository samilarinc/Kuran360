import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { Bookmark, LastRead, UserData, DuaItem, DuaRequest } from '../types';
import { collection, onSnapshot, query, where, orderBy, deleteDoc, addDoc } from 'firebase/firestore';

type UserDataContextType = {
    bookmarks: Bookmark[];
    lastRead: LastRead[];
    duaList: DuaItem[];
    duaRequests: DuaRequest[];
    addBookmark: (surahNumber: number, verseNumber: number, surahName: string, verseText: string, note?: string) => Promise<void>;
    removeBookmark: (bookmarkId: string) => Promise<void>;
    isBookmarked: (surahNumber: number, verseNumber: number) => boolean;
    addToLastRead: (surahNumber: number, verseNumber: number, surahName: string, verseText: string) => Promise<void>;
    // Dua methods
    addDua: (person: string, topic: string, isPersonal: boolean) => Promise<void>;
    updateDua: (duaId: string, updates: Partial<DuaItem>) => Promise<void>;
    deleteDua: (duaId: string) => Promise<void>;
    acceptDuaRequest: (request: DuaRequest) => Promise<void>;
    rejectDuaRequest: (requestId: string) => Promise<void>;
    loading: boolean;
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [lastRead, setLastRead] = useState<LastRead[]>([]);
    const [duaList, setDuaList] = useState<DuaItem[]>([]);
    const [duaRequests, setDuaRequests] = useState<DuaRequest[]>([]);
    const [loading, setLoading] = useState(false);

    // Load user data when user changes
    useEffect(() => {
        let unsubRequests: () => void;
        let unsubUserData: () => void;

        if (user?.uid) {
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            unsubUserData = onSnapshot(userDocRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as UserData;
                    setBookmarks(data.bookmarks || []);
                    setLastRead(data.lastRead || []);
                    setDuaList(data.duaList || []);
                } else {
                    // Create initial document if it doesn't exist
                    const initialData: UserData = { bookmarks: [], lastRead: [], duaList: [] };
                    setDoc(userDocRef, initialData);
                }
            }, (error) => {
                console.error('Error listening to user data:', error);
            });

            // Listen to dua requests
            const requestsRef = collection(db, 'users', user.uid, 'duaRequests');
            const q = query(requestsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));

            unsubRequests = onSnapshot(q, (snapshot) => {
                const requests: DuaRequest[] = [];
                snapshot.forEach((doc) => {
                    requests.push({ id: doc.id, ...doc.data() } as DuaRequest);
                });
                setDuaRequests(requests);
            }, (error) => {
                console.error('Error listening to dua requests:', error);
            });
        } else {
            // Clear data when user logs out
            setBookmarks([]);
            setLastRead([]);
            setDuaList([]);
            setDuaRequests([]);
        }

        return () => {
            if (unsubUserData) unsubUserData();
            if (unsubRequests) unsubRequests();
        };
    }, [user?.uid]);


    const addBookmark = async (surahNumber: number, verseNumber: number, surahName: string, verseText: string, note?: string) => {
        if (!user?.uid) return;

        // Validate inputs to prevent undefined data in Firebase
        if (!surahNumber || !verseNumber || !surahName || !verseText) {
            console.error('Invalid bookmark data:', { surahNumber, verseNumber, surahName, verseText });
            return;
        }

        const base = {
            id: `${surahNumber}-${verseNumber}-${Date.now()}`,
            surahNumber,
            verseNumber,
            surahName,
            verseText: verseText.substring(0, 100) + (verseText.length > 100 ? '...' : ''),
            createdAt: Date.now(),
        } as const;
        const newBookmark: Bookmark = (note && note.trim().length > 0)
            ? { ...base, note }
            : { ...base };

        try {
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, {
                bookmarks: arrayUnion(newBookmark)
            });
        } catch (error) {
            console.error('Error adding bookmark:', error);
        }
    };

    const removeBookmark = async (bookmarkId: string) => {
        if (!user?.uid) return;

        const bookmarkToRemove = bookmarks.find(b => b.id === bookmarkId);
        if (!bookmarkToRemove) return;

        try {
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, {
                bookmarks: arrayRemove(bookmarkToRemove)
            });
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    };

    const isBookmarked = (surahNumber: number, verseNumber: number): boolean => {
        return bookmarks.some(b => b.surahNumber === surahNumber && b.verseNumber === verseNumber);
    };

    // Throttle duplicate lastRead writes for the same verse within 10 seconds
    const lastReadCacheRef = useRef<string | null>(null);

    const addToLastRead = async (surahNumber: number, verseNumber: number, surahName: string, verseText: string) => {
        if (!user?.uid) return;

        // Validate inputs to prevent undefined data in Firebase
        if (!surahNumber || !verseNumber || !surahName || !verseText) {
            console.error('Invalid last read data:', { surahNumber, verseNumber, surahName, verseText });
            return;
        }

        const newLastRead: LastRead = {
            surahNumber,
            verseNumber,
            surahName,
            verseText: verseText.substring(0, 100) + (verseText.length > 100 ? '...' : ''),
            timestamp: Date.now(),
            url: `surah/${surahNumber}/verse/${verseNumber}`,
        };

        try {
            const cacheKey = `${surahNumber}-${verseNumber}`;

            // Check if this verse is already in the recent readings
            const existingIndex = lastRead.findIndex(lr =>
                lr.surahNumber === surahNumber && lr.verseNumber === verseNumber
            );

            let updatedLastRead: LastRead[];

            if (existingIndex !== -1) {
                // Verse already exists, update its timestamp and move to front
                updatedLastRead = [
                    newLastRead,
                    ...lastRead.filter((_, index) => index !== existingIndex)
                ];
            } else {
                // New verse, add to front and remove oldest if we have more than 5
                updatedLastRead = [newLastRead, ...lastRead];
                if (updatedLastRead.length > 5) {
                    updatedLastRead = updatedLastRead.slice(0, 5);
                }
            }

            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, {
                lastRead: updatedLastRead
            });
        } catch (error) {
            console.error('Error updating last read:', error);
        }
    };

    const addDua = async (person: string, topic: string, isPersonal: boolean) => {
        if (!user?.uid) return;

        const newDua: DuaItem = {
            id: Date.now().toString(),
            person,
            topic,
            isChecked: false,
            isPersonal,
            createdAt: Date.now(),
        };

        try {
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, {
                duaList: arrayUnion(newDua)
            });
        } catch (error) {
            console.error('Error adding dua:', error);
        }
    };

    const updateDua = async (duaId: string, updates: Partial<DuaItem>) => {
        if (!user?.uid) return;

        const updatedDuaList = duaList.map(dua =>
            dua.id === duaId ? { ...dua, ...updates } : dua
        );

        try {
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, {
                duaList: updatedDuaList
            });
        } catch (error) {
            console.error('Error updating dua:', error);
        }
    };

    const deleteDua = async (duaId: string) => {
        if (!user?.uid) return;

        const updatedDuaList = duaList.filter(dua => dua.id !== duaId);

        try {
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, {
                duaList: updatedDuaList
            });
        } catch (error) {
            console.error('Error deleting dua:', error);
        }
    };

    const acceptDuaRequest = async (request: DuaRequest) => {
        if (!user?.uid) return;

        try {
            // Add to dua list
            await addDua(request.requesterName, request.topic, false);

            // Delete request
            const requestRef = doc(db, 'users', user.uid, 'duaRequests', request.id);
            await deleteDoc(requestRef);
        } catch (error) {
            console.error('Error accepting dua request:', error);
        }
    };

    const rejectDuaRequest = async (requestId: string) => {
        if (!user?.uid) return;

        try {
            const requestRef = doc(db, 'users', user.uid, 'duaRequests', requestId);
            await deleteDoc(requestRef);
        } catch (error) {
            console.error('Error rejecting dua request:', error);
        }
    };

    const contextValue: UserDataContextType = {
        bookmarks,
        lastRead,
        duaList,
        duaRequests,
        addBookmark,
        removeBookmark,
        isBookmarked,
        addToLastRead,
        addDua,
        updateDua,
        deleteDua,
        acceptDuaRequest,
        rejectDuaRequest,
        loading,
    };

    return (
        <UserDataContext.Provider value={contextValue}>
            {children}
        </UserDataContext.Provider>
    );
};

export const useUserData = (): UserDataContextType => {
    const context = useContext(UserDataContext);
    if (!context) {
        throw new Error('useUserData must be used within UserDataProvider');
    }
    return context;
};
