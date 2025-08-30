import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { Bookmark, LastRead, UserData } from '../types';

type UserDataContextType = {
    bookmarks: Bookmark[];
    lastRead: LastRead[];
    addBookmark: (surahNumber: number, verseNumber: number, surahName: string, verseText: string, note?: string) => Promise<void>;
    removeBookmark: (bookmarkId: string) => Promise<void>;
    isBookmarked: (surahNumber: number, verseNumber: number) => boolean;
    addToLastRead: (surahNumber: number, verseNumber: number, surahName: string, verseText: string) => Promise<void>;
    loading: boolean;
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [lastRead, setLastRead] = useState<LastRead[]>([]);
    const [loading, setLoading] = useState(false);

    // Load user data when user changes
    useEffect(() => {
        if (user?.uid) {
            loadUserData();
        } else {
            // Clear data when user logs out
            setBookmarks([]);
            setLastRead([]);
        }
    }, [user?.uid]);

    const loadUserData = async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', user.uid, 'data', 'userData');
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data() as UserData;
                setBookmarks(data.bookmarks || []);
                setLastRead(data.lastRead || []);
            } else {
                // Create initial document
                const initialData: UserData = { bookmarks: [], lastRead: [] };
                await setDoc(userDocRef, initialData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

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
            setBookmarks(prev => [...prev, newBookmark]);
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
            setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
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
            setLastRead(updatedLastRead);
        } catch (error) {
            console.error('Error updating last read:', error);
        }
    };

    const contextValue: UserDataContextType = {
        bookmarks,
        lastRead,
        addBookmark,
        removeBookmark,
        isBookmarked,
        addToLastRead,
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
