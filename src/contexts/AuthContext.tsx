import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, type User } from '../services/firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

type AuthContextType = {
    user: User | null;
    loading: boolean;
    signOutUser: () => Promise<void>;
    updateDisplayName: (newDisplayName: string) => Promise<void>;
    userProfile: UserProfile | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                await loadUserProfile(u);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const loadUserProfile = async (user: User) => {
        try {
            const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
            const profileDoc = await getDoc(profileRef);

            if (profileDoc.exists()) {
                const profile = profileDoc.data() as UserProfile;
                setUserProfile(profile);
            } else {
                // Create initial profile from Firebase Auth data
                const initialProfile: UserProfile = {
                    displayName: user.displayName || 'İsimsiz Kullanıcı',
                    email: user.email || '',
                    photoURL: user.photoURL || undefined,
                    updatedAt: Date.now()
                };
                await setDoc(profileRef, initialProfile);
                setUserProfile(initialProfile);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fallback to auth data
            setUserProfile({
                displayName: user.displayName || 'İsimsiz Kullanıcı',
                email: user.email || '',
                photoURL: user.photoURL || undefined,
                updatedAt: Date.now()
            });
        }
    };

    const updateDisplayName = async (newDisplayName: string) => {
        if (!user) throw new Error('Kullanıcı oturumu açık değil');

        try {
            // Update Firebase Auth profile
            await updateProfile(user, { displayName: newDisplayName });

            // Update Firestore profile
            const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
            const updatedProfile: UserProfile = {
                displayName: newDisplayName,
                email: user.email || '',
                photoURL: user.photoURL || undefined,
                updatedAt: Date.now()
            };

            await setDoc(profileRef, updatedProfile, { merge: true });
            setUserProfile(updatedProfile);

            // Force refresh the user object to get updated displayName
            await user.reload();
        } catch (error) {
            console.error('Error updating display name:', error);
            throw error;
        }
    };

    const signOutUser = async () => {
        await signOut(auth);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signOutUser, updateDisplayName }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
