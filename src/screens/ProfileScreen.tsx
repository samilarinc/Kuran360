import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Platform, ScrollView, FlatList } from 'react-native';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../constants';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import Constants from 'expo-constants';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, signOutUser } = useAuth();
    const { bookmarks, lastRead, removeBookmark } = useUserData();
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

    const handleBookmarkPress = (bookmark: any) => {
        // Navigate to the specific verse
        navigation.navigate('SurahDetail', {
            surah: { number: bookmark.surahNumber, name: bookmark.surahName, verseCount: 0, verses: [] },
            verseIndex: bookmark.verseNumber - 1
        });
    };

    const handleLastReadPress = (lastReadItem: any) => {
        // Navigate to the specific verse
        navigation.navigate('SurahDetail', {
            surah: { number: lastReadItem.surahNumber, name: lastReadItem.surahName, verseCount: 0, verses: [] },
            verseIndex: lastReadItem.verseNumber - 1
        });
    };

    const renderBookmark = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={createStyles(theme).listItem}
            onPress={() => handleBookmarkPress(item)}
        >
            <View style={createStyles(theme).listItemContent}>
                <Text style={createStyles(theme).listItemTitle}>
                    {item.surahName} - Ayet {item.verseNumber}
                </Text>
                <Text style={createStyles(theme).listItemSubtitle} numberOfLines={2}>
                    {item.verseText}
                </Text>
            </View>
            <TouchableOpacity
                style={createStyles(theme).removeButton}
                onPress={() => removeBookmark(`${item.surahNumber}-${item.verseNumber}`)}
            >
                <Text style={createStyles(theme).removeButtonText}>🗑️</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderLastRead = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={createStyles(theme).listItem}
            onPress={() => handleLastReadPress(item)}
        >
            <View style={createStyles(theme).listItemContent}>
                <Text style={createStyles(theme).listItemTitle}>
                    {item.surahName} - Ayet {item.verseNumber}
                </Text>
                <Text style={createStyles(theme).listItemSubtitle} numberOfLines={2}>
                    {item.verseText}
                </Text>
            </View>
            <Text style={createStyles(theme).timeText}>
                {new Date(item.timestamp).toLocaleDateString('tr-TR')}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={createStyles(theme).container}>
            <HeaderWithDarkModeToggle title="Profil" showBackButton onBackPress={() => navigation.goBack()} />

            <ScrollView style={createStyles(theme).content}>
                {user ? (
                    <>
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

                        {/* Bookmarks Section */}
                        <View style={createStyles(theme).section}>
                            <Text style={createStyles(theme).sectionTitle}>Favoriler ({bookmarks.length})</Text>
                            {bookmarks.length > 0 ? (
                                <FlatList
                                    data={bookmarks}
                                    renderItem={renderBookmark}
                                    keyExtractor={(item) => `${item.surahNumber}-${item.verseNumber}`}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <Text style={createStyles(theme).emptyText}>Henüz favori ayet eklenmemiş.</Text>
                            )}
                        </View>

                        {/* Last Read Section */}
                        <View style={createStyles(theme).section}>
                            <Text style={createStyles(theme).sectionTitle}>Son Okuduklarım ({lastRead.length})</Text>
                            {lastRead.length > 0 ? (
                                <FlatList
                                    data={lastRead}
                                    renderItem={renderLastRead}
                                    keyExtractor={(item) => `${item.surahNumber}-${item.verseNumber}-${item.timestamp}`}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <Text style={createStyles(theme).emptyText}>Henüz okunmuş ayet bulunmuyor.</Text>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={createStyles(theme).card}>
                        <Text style={[createStyles(theme).email, { marginBottom: SPACING.md }]}>Oturum açılmamış.</Text>
                        <TouchableOpacity style={createStyles(theme).googleBtn} onPress={signInWithGoogle}>
                            <Text style={createStyles(theme).googleBtnText}>Google ile Giriş Yap</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
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
    section: {
        marginTop: SPACING.lg,
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: theme.border,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '600',
        color: theme.text,
        marginBottom: SPACING.md,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        backgroundColor: theme.surface,
        borderRadius: 8,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: theme.border,
    },
    listItemContent: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    listItemTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 4,
    },
    listItemSubtitle: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        lineHeight: FONT_SIZES.small * 1.4,
    },
    removeButton: {
        padding: SPACING.xs,
        backgroundColor: theme.accent,
        borderRadius: 6,
    },
    removeButtonText: {
        fontSize: 16,
    },
    timeText: {
        fontSize: FONT_SIZES.small,
        color: theme.textSecondary,
        fontStyle: 'italic',
    },
    emptyText: {
        fontSize: FONT_SIZES.medium,
        color: theme.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: SPACING.lg,
    },
});
