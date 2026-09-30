import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from './AuthContext';
import { Bookmark, LastRead, UserData, DuaItem, DuaRequest } from '@/types';
import { collection, onSnapshot, query, where, orderBy, deleteDoc } from 'firebase/firestore';

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

const EMPTY_USER_DATA: UserData = { bookmarks: [], lastRead: [], duaList: [] };

const LAST_READ_STORAGE_KEY = 'quran_app_last_read';
const MAX_LAST_READ = 5;

// Union of the lists: each verse keeps its newest timestamp, newest verses first, capped
const mergeLastRead = (...lists: LastRead[][]): LastRead[] => {
    const newest = new Map<string, LastRead>();
    for (const item of lists.flat()) {
        const key = `${item.surahNumber}:${item.verseNumber}`;
        const existing = newest.get(key);
        if (!existing || (item.timestamp ?? 0) > (existing.timestamp ?? 0)) newest.set(key, item);
    }
    return [...newest.values()].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, MAX_LAST_READ);
};

const sameLastRead = (a: LastRead[], b: LastRead[]): boolean =>
    a.length === b.length && a.every((item, i) =>
        item.surahNumber === b[i].surahNumber && item.verseNumber === b[i].verseNumber && item.timestamp === b[i].timestamp);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const userDataKey = ['userData', user?.uid ?? null];
    const duaRequestsKey = ['duaRequests', user?.uid ?? null];

    // Firestore onSnapshot listeners push live updates into the React Query cache;
    // useQuery just exposes that cache as regular query state to the rest of the app.
    const { data: userData = EMPTY_USER_DATA, isLoading } = useQuery({
        queryKey: userDataKey,
        queryFn: () => EMPTY_USER_DATA,
        enabled: !!user?.uid,
        staleTime: Infinity,
    });

    const { data: duaRequests = [] } = useQuery<DuaRequest[]>({
        queryKey: duaRequestsKey,
        queryFn: () => [],
        enabled: !!user?.uid,
        staleTime: Infinity,
    });

    // Last read lives on the device for everyone; signed-in users also sync it with Firestore.
    // Both sides are merged by timestamp, and whichever side is behind is brought up to date.
    const [localLastRead, setLocalLastRead] = useState<LastRead[]>([]);
    const [localLoaded, setLocalLoaded] = useState(false);
    const [remoteReadyUid, setRemoteReadyUid] = useState<string | null>(null);

    useEffect(() => {
        AsyncStorage.getItem(LAST_READ_STORAGE_KEY)
            .then((raw) => {
                if (raw) setLocalLastRead((current) => mergeLastRead(current, JSON.parse(raw)));
            })
            .catch((error) => console.error('Error reading local last read:', error))
            .finally(() => setLocalLoaded(true));
    }, []);

    useEffect(() => {
        if (!localLoaded) return;
        AsyncStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(localLastRead))
            .catch((error) => console.error('Error saving local last read:', error));
    }, [localLastRead, localLoaded]);

    useEffect(() => {
        if (!user?.uid) {
            queryClient.setQueryData(userDataKey, EMPTY_USER_DATA);
            queryClient.setQueryData(duaRequestsKey, []);
            return;
        }

        const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
        const unsubUserData = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as UserData;
                queryClient.setQueryData(userDataKey, {
                    bookmarks: data.bookmarks || [],
                    lastRead: data.lastRead || [],
                    duaList: data.duaList || [],
                });
                setRemoteReadyUid(user.uid);
            } else if (!snapshot.metadata.fromCache) {
                setDoc(userDocRef, EMPTY_USER_DATA);
                setRemoteReadyUid(user.uid);
            }
        }, (error) => {
            console.error('Error listening to user data:', error);
        });

        const requestsRef = collection(db, 'users', user.uid, 'duaRequests');
        const q = query(requestsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
        const unsubRequests = onSnapshot(q, (snapshot) => {
            const requests: DuaRequest[] = [];
            snapshot.forEach((d) => requests.push({ id: d.id, ...d.data() } as DuaRequest));
            queryClient.setQueryData(duaRequestsKey, requests);
        }, (error) => {
            console.error('Error listening to dua requests:', error);
        });

        return () => {
            unsubUserData();
            unsubRequests();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    const { bookmarks, duaList = [] } = userData;
    const remoteLastRead = userData.lastRead;
    const remoteReady = !!user?.uid && remoteReadyUid === user.uid;
    const lastRead = useMemo(() => mergeLastRead(localLastRead, remoteLastRead), [localLastRead, remoteLastRead]);

    useEffect(() => {
        if (!localLoaded) return;
        if (!sameLastRead(lastRead, localLastRead)) setLocalLastRead(lastRead);
        // Wait for the first Firestore snapshot so the device copy never overwrites newer cloud data
        if (user?.uid && remoteReady && !sameLastRead(lastRead, remoteLastRead)) {
            setDoc(doc(db, 'users', user.uid, 'data', 'userData'), { lastRead }, { merge: true })
                .catch((error) => console.error('Error syncing last read:', error));
        }
    }, [lastRead, localLastRead, remoteLastRead, localLoaded, remoteReady, user?.uid]);

    const addBookmarkMutation = useMutation({
        mutationFn: async (newBookmark: Bookmark) => {
            if (!user?.uid) return;
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, { bookmarks: arrayUnion(newBookmark) });
        },
    });

    const addBookmark = async (surahNumber: number, verseNumber: number, surahName: string, verseText: string, note?: string) => {
        if (!user?.uid) return;
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
            await addBookmarkMutation.mutateAsync(newBookmark);
        } catch (error) {
            console.error('Error adding bookmark:', error);
        }
    };

    const removeBookmarkMutation = useMutation({
        mutationFn: async (bookmarkToRemove: Bookmark) => {
            if (!user?.uid) return;
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, { bookmarks: arrayRemove(bookmarkToRemove) });
        },
    });

    const removeBookmark = async (bookmarkId: string) => {
        if (!user?.uid) return;
        const bookmarkToRemove = bookmarks.find(b => b.id === bookmarkId);
        if (!bookmarkToRemove) return;
        try {
            await removeBookmarkMutation.mutateAsync(bookmarkToRemove);
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    };

    const isBookmarked = (surahNumber: number, verseNumber: number): boolean => {
        return bookmarks.some(b => b.surahNumber === surahNumber && b.verseNumber === verseNumber);
    };

    const addToLastRead = useCallback(async (surahNumber: number, verseNumber: number, surahName: string, verseText: string) => {
        if (!surahNumber || !verseNumber || !surahName) {
            console.error('Invalid last read data:', { surahNumber, verseNumber, surahName });
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

        setLocalLastRead((current) => mergeLastRead([newLastRead], current));
    }, []);

    const addDuaMutation = useMutation({
        mutationFn: async (newDua: DuaItem) => {
            if (!user?.uid) return;
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, { duaList: arrayUnion(newDua) });
        },
    });

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
            await addDuaMutation.mutateAsync(newDua);
        } catch (error) {
            console.error('Error adding dua:', error);
        }
    };

    const setDuaListMutation = useMutation({
        mutationFn: async (updatedDuaList: DuaItem[]) => {
            if (!user?.uid) return;
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            await updateDoc(userDocRef, { duaList: updatedDuaList });
        },
    });

    const updateDua = async (duaId: string, updates: Partial<DuaItem>) => {
        if (!user?.uid) return;
        const updatedDuaList = duaList.map(dua => dua.id === duaId ? { ...dua, ...updates } : dua);
        try {
            await setDuaListMutation.mutateAsync(updatedDuaList);
        } catch (error) {
            console.error('Error updating dua:', error);
        }
    };

    const deleteDua = async (duaId: string) => {
        if (!user?.uid) return;
        const updatedDuaList = duaList.filter(dua => dua.id !== duaId);
        try {
            await setDuaListMutation.mutateAsync(updatedDuaList);
        } catch (error) {
            console.error('Error deleting dua:', error);
        }
    };

    const rejectDuaRequestMutation = useMutation({
        mutationFn: async (requestId: string) => {
            if (!user?.uid) return;
            const requestRef = doc(db, 'users', user.uid, 'duaRequests', requestId);
            await deleteDoc(requestRef);
        },
    });

    const acceptDuaRequest = async (request: DuaRequest) => {
        if (!user?.uid) return;
        try {
            await addDua(request.requesterName, request.topic, false);
            await rejectDuaRequestMutation.mutateAsync(request.id);
        } catch (error) {
            console.error('Error accepting dua request:', error);
        }
    };

    const rejectDuaRequest = async (requestId: string) => {
        if (!user?.uid) return;
        try {
            await rejectDuaRequestMutation.mutateAsync(requestId);
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
        loading: !!user?.uid && isLoading,
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
