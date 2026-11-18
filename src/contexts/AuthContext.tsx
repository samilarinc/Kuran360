import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth, googleProvider } from '@/services/firebase';
import {
    User,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    revokeAccessToken,
    deleteUser,
    updateProfile
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { deleteUserData } from '@/services/account';
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
    /** Sign in with Apple, offered on iOS next to Google (App Store guideline 4.8) */
    signInWithApple: () => Promise<void>;
    appleSignInAvailable: boolean;
    googleSignInAvailable: boolean;
    /** Deletes the user's data and account; 'reauth' when Firebase wants a fresh sign-in first */
    deleteAccount: () => Promise<'deleted' | 'reauth' | 'cancelled'>;
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
    const iosReversedClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID;
    // Without a client ID for this platform useAuthRequest throws on render; hide the button instead of crashing
    const googleSignInAvailable = Platform.select({
        ios: !!googleConfig.iosClientId,
        android: !!googleConfig.androidClientId,
        default: true,
    });
    const config = {
        ...googleConfig,
        iosClientId: googleConfig.iosClientId || 'unconfigured',
        androidClientId: googleConfig.androidClientId || 'unconfigured',
        redirectUri: Platform.OS === 'ios' && iosReversedClientId
            ? `${iosReversedClientId}:/oauthredirect`
            : AuthSession.makeRedirectUri({
                scheme: 'com.kuran360',
                preferLocalhost: true,
            }),
    };
    const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
    useEffect(() => {
        if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleSignInAvailable).catch(() => { });
    }, []);

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

    /** Asks Apple for a sign-in; returns the Firebase credential and the one-time authorization code (null if cancelled). */
    const requestAppleCredential = async () => {
        const rawNonce = Crypto.randomUUID();
        const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
        try {
            const apple = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });
            if (!apple.identityToken) throw new Error('Apple returned no identity token');
            const credential = new OAuthProvider('apple.com').credential({ idToken: apple.identityToken, rawNonce });
            return { credential, apple };
        } catch (error: any) {
            if (error?.code === 'ERR_REQUEST_CANCELED') return null;
            throw error;
        }
    };

    const signInWithApple = async () => {
        try {
            const result = await requestAppleCredential();
            if (!result) return;
            const { user: signedIn } = await signInWithCredential(auth, result.credential);
            // Apple sends the name only on the first sign-in
            const name = [result.apple.fullName?.givenName, result.apple.fullName?.familyName].filter(Boolean).join(' ');
            if (name && !signedIn.displayName) {
                await updateProfile(signedIn, { displayName: name });
                // The profile may already have been created without the name (onAuthStateChanged fires first)
                await setDoc(doc(db, 'users', signedIn.uid, 'profile', 'info'), { displayName: name, updatedAt: Date.now() }, { merge: true });
                await setDoc(doc(db, 'users', signedIn.uid, 'profile', 'public'), { displayName: name }, { merge: true });
                queryClient.invalidateQueries({ queryKey: ['userProfile', signedIn.uid] });
            }
        } catch (error) {
            console.error('Error signing in with Apple:', error);
        }
    };

    const deleteAccount = async (): Promise<'deleted' | 'reauth' | 'cancelled'> => {
        const current = auth.currentUser;
        if (!current) return 'cancelled';
        const isApple = current.providerData.some(p => p.providerId === 'apple.com');
        if (isApple && Platform.OS === 'ios') {
            // Fresh Apple sign-in: satisfies Firebase's recent-login check and gives the code to revoke the Apple token
            const result = await requestAppleCredential();
            if (!result) return 'cancelled';
            await reauthenticateWithCredential(current, result.credential);
            if (result.apple.authorizationCode) {
                await revokeAccessToken(auth, result.apple.authorizationCode).catch(e => console.error('Error revoking Apple token:', e));
            }
        } else if (Platform.OS === 'web') {
            await reauthenticateWithPopup(current, googleProvider);
        } else {
            // Native Google sign-in comes back through a redirect, so ask for a fresh sign-in when the last one is old
            const lastSignIn = Date.parse(current.metadata.lastSignInTime ?? '');
            if (!(Date.now() - lastSignIn < 4 * 60 * 1000)) return 'reauth';
        }
        await deleteUserData(current.uid);
        try {
            await deleteUser(current);
        } catch (error: any) {
            if (error?.code === 'auth/requires-recent-login') return 'reauth';
            throw error;
        }
        queryClient.clear();
        return 'deleted';
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signInWithApple, appleSignInAvailable, googleSignInAvailable, deleteAccount, signOutUser, updateDisplayName }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
