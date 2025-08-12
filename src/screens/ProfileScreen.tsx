import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Platform } from 'react-native';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../constants';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import Constants from 'expo-constants';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, signOutUser } = useAuth();
    const { theme } = useTheme();

    const signInWithGoogle = async () => {
        try {
            if (Platform.OS === 'web') {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
                return;
            }
            // Native: use expo-auth-session (deferred wiring). For now, show minimal guidance.
            throw new Error('Google SSO for native requires expo-auth-session setup.');
        } catch (e: any) {
            console.warn('Google sign-in failed:', e?.message || e);
        }
    };

    return (
        <SafeAreaView style={createStyles(theme).container}>
            <HeaderWithDarkModeToggle title="Profil" showBackButton onBackPress={() => navigation.goBack()} />

            <View style={createStyles(theme).content}>
                {user ? (
                    <View style={createStyles(theme).card}>
                        <View style={createStyles(theme).avatarRow}>
                            {user.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={createStyles(theme).avatar} />
                            ) : (
                                <View style={[createStyles(theme).avatar, createStyles(theme).avatarFallback]}>
                                    <Text style={createStyles(theme).avatarInitials}>{user.displayName?.charAt(0) || 'U'}</Text>
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={createStyles(theme).name}>{user.displayName || 'İsimsiz Kullanıcı'}</Text>
                                <Text style={createStyles(theme).email}>{user.email || '—'}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={createStyles(theme).signOutBtn} onPress={signOutUser}>
                            <Text style={createStyles(theme).signOutText}>Çıkış Yap</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={createStyles(theme).card}>
                        <Text style={[createStyles(theme).email, { marginBottom: SPACING.md }]}>Oturum açılmamış.</Text>
                        <TouchableOpacity style={createStyles(theme).googleBtn} onPress={signInWithGoogle}>
                            <Text style={createStyles(theme).googleBtnText}>Google ile Giriş Yap</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: SPACING.lg },
    card: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: theme.border,
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
    avatar: { width: 64, height: 64, borderRadius: 32, marginRight: SPACING.md },
    avatarFallback: { backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: 24, color: theme.primary, fontWeight: '700' },
    name: { fontSize: FONT_SIZES.large, color: theme.text, fontWeight: '600' },
    email: { fontSize: FONT_SIZES.small, color: theme.secondary },
    signOutBtn: {
        marginTop: SPACING.lg,
        backgroundColor: theme.primary,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    signOutText: { color: '#fff', fontWeight: '600' },
    googleBtn: {
        backgroundColor: '#DB4437',
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    googleBtnText: { color: '#fff', fontWeight: '600' },
});
