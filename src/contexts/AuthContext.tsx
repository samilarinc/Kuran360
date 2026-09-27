import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth, googleProvider } from '@/services/firebase';
import {
    User,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential,
    updateProfile
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

WebBrowser.maybeCompleteAuthSession();

interface UserProfile {
    displayName: string;
    email: string;
    photoURL?: string;
    updatedAt: number;
}

type AuthContextType = {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOutUser: () => Promise<void>;
    updateDisplayName: (newDisplayName: string) => Promise<void>;
    userProfile: UserProfile | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchOrCreateUserProfile = async (user: User): Promise<UserProfile> => {
    try {
        const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
        const profileDoc = await getDoc(profileRef);

        if (profileDoc.exists()) {
            const profile = profileDoc.data() as UserProfile;
            const publicProfileRef = doc(db, 'users', user.uid, 'profile', 'public');
            const publicProfileDoc = await getDoc(publicProfileRef);
            if (!publicProfileDoc.exists()) {
                await setDoc(publicProfileRef, { displayName: profile.displayName });
            }
            return profile;
        }

        const initialProfile: UserProfile = {
            displayName: user.displayName || 'İsimsiz Kullanıcı',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            updatedAt: Date.now()
        };
        await setDoc(profileRef, initialProfile);
        const publicProfileRef = doc(db, 'users', user.uid, 'profile', 'public');
        await setDoc(publicProfileRef, { displayName: initialProfile.displayName });
        return initialProfile;
    } catch (error) {
        console.error('Error loading user profile:', error);
        return {
            displayName: user.displayName || 'İsimsiz Kullanıcı',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            updatedAt: Date.now()
        };
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();
    const profileQueryKey = ['userProfile', user?.uid ?? null];

    const { data: userProfile = null } = useQuery({
        queryKey: profileQueryKey,
        queryFn: () => fetchOrCreateUserProfile(user as User),
        enabled: !!user?.uid,
    });

    // Get Google OAuth config with fallback
    const getGoogleConfig = () => {
        // Try environment variables first
        const envConfig = {
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        };

        if (envConfig.webClientId) {
            return envConfig;
        }

        return envConfig;
    };

    const googleConfig = getGoogleConfig();
    const config = {
        ...googleConfig,
        androidClientId: googleConfig.androidClientId,
        redirectUri: AuthSession.makeRedirectUri({
            scheme: 'com.kuran360',
            preferLocalhost: true,
        }),
    };

    const [_request, response, promptAsync] = Google.useAuthRequest(config);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                const credential = GoogleAuthProvider.credential(
                    authentication.idToken,
                    authentication.accessToken
                );
                signInWithCredential(auth, credential);
            }
        } else if (response?.type === 'error' || response?.type === 'cancel') {
            console.log('Google Auth Response:', response);
        }
    }, [response]);

    const updateDisplayNameMutation = useMutation({
        mutationFn: async (newDisplayName: string) => {
            if (!user) throw new Error('Kullanıcı oturumu açık değil');

            await updateProfile(user, { displayName: newDisplayName });

            const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
            const updatedProfile: UserProfile = {
                displayName: newDisplayName,
                email: user.email || '',
                photoURL: user.photoURL || undefined,
                updatedAt: Date.now()
            };

            await setDoc(profileRef, updatedProfile, { merge: true });
            const publicProfileRef = doc(db, 'users', user.uid, 'profile', 'public');
            await setDoc(publicProfileRef, { displayName: newDisplayName }, { merge: true });
            await user.reload();
            return updatedProfile;
        },
        onSuccess: (updatedProfile) => {
            queryClient.setQueryData(profileQueryKey, updatedProfile);
        },
    });

    const updateDisplayName = async (newDisplayName: string) => {
        try {
            await updateDisplayNameMutation.mutateAsync(newDisplayName);
        } catch (error) {
            console.error('Error updating display name:', error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            if (Platform.OS === 'web') {
                await signInWithPopup(auth, googleProvider);
            } else {
                await promptAsync();
            }
        } catch (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    const signOutUser = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signOutUser, updateDisplayName }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
