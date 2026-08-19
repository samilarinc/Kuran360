import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Platform, ScrollView, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../constants';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import Constants from 'expo-constants';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, userProfile, signOutUser, updateDisplayName, signInWithGoogle } = useAuth();
    const { bookmarks, lastRead, removeBookmark } = useUserData();
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditName = () => {
        setNewDisplayName(userProfile?.displayName || user?.displayName || '');
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        if (!newDisplayName.trim()) {
            Alert.alert(t('profileScreen.nameEmptyTitle'), t('profileScreen.nameEmptyMessage'));
            return;
        }

        if (newDisplayName.trim().length < 2) {
            Alert.alert(t('profileScreen.nameEmptyTitle'), t('profileScreen.nameTooShortMessage'));
            return;
        }

        setIsUpdating(true);
        try {
            await updateDisplayName(newDisplayName.trim());
            setIsEditingName(false);
            Alert.alert(t('profileScreen.nameUpdatedTitle'), t('profileScreen.nameUpdatedMessage'));
        } catch (error) {
            console.error('Error updating display name:', error);
            Alert.alert(t('profileScreen.nameEmptyTitle'), t('profileScreen.nameUpdateErrorMessage'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setNewDisplayName('');
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
                    {t('profileScreen.verseLabel', { surahName: item.surahName, verseNumber: item.verseNumber })}
                </Text>
                <Text style={createStyles(theme).listItemSubtitle} numberOfLines={2}>
                    {item.verseText}
                </Text>
            </View>
            <TouchableOpacity
                style={createStyles(theme).removeButton}
                onPress={() => removeBookmark(item.id)}
            >
                <Text style={createStyles(theme).removeButtonText}>✕</Text>
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
                    {t('profileScreen.verseLabel', { surahName: item.surahName, verseNumber: item.verseNumber })}
                </Text>
                <Text style={createStyles(theme).listItemSubtitle} numberOfLines={2}>
                    {item.verseText}
                </Text>
            </View>
            <Text style={createStyles(theme).timeText}>
                {new Date(item.timestamp).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'tr-TR')}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={createStyles(theme).container}>
            <HeaderWithDarkModeToggle
                title={t('screenTitles.profile')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView style={createStyles(theme).content}>
                {user ? (
                    <>
                        <View style={createStyles(theme).card}>
                            <View style={createStyles(theme).avatarRow}>
                                {user.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={createStyles(theme).avatar} />
                                ) : (
                                    <View style={[createStyles(theme).avatar, createStyles(theme).avatarFallback]}>
                                        <Text style={createStyles(theme).avatarInitials}>
                                            {(userProfile?.displayName || user.displayName)?.charAt(0) || 'U'}
                                        </Text>
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    {isEditingName ? (
                                        <View style={createStyles(theme).editNameContainer}>
                                            <TextInput
                                                style={createStyles(theme).nameInput}
                                                value={newDisplayName}
                                                onChangeText={setNewDisplayName}
                                                placeholder={t('profileScreen.namePlaceholder')}
                                                placeholderTextColor={theme.textSecondary}
                                                maxLength={50}
                                                autoFocus
                                            />
                                            <View style={createStyles(theme).editButtonRow}>
                                                <TouchableOpacity
                                                    style={[createStyles(theme).editButton, createStyles(theme).cancelButton]}
                                                    onPress={handleCancelEdit}
                                                    disabled={isUpdating}
                                                >
                                                    <Text style={createStyles(theme).cancelButtonText}>{t('profileScreen.cancel')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[createStyles(theme).editButton, createStyles(theme).saveButton]}
                                                    onPress={handleSaveName}
                                                    disabled={isUpdating}
                                                >
                                                    <Text style={createStyles(theme).saveButtonText}>
                                                        {isUpdating ? t('profileScreen.saving') : t('profileScreen.save')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={createStyles(theme).nameContainer}>
                                            <Text style={createStyles(theme).name}>
                                                {userProfile?.displayName || user.displayName || t('profileScreen.defaultUserName')}
                                            </Text>
                                            <TouchableOpacity
                                                style={createStyles(theme).editNameButton}
                                                onPress={handleEditName}
                                            >
                                                <Text style={createStyles(theme).editNameButtonText}>✏️</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    <Text style={createStyles(theme).email}>{user.email || '—'}</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={createStyles(theme).signOutBtn} onPress={signOutUser}>
                                <Text style={createStyles(theme).signOutText}>{t('profileScreen.signOut')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bookmarks Section */}
                        <View style={createStyles(theme).section}>
                            <Text style={createStyles(theme).sectionTitle}>{t('profileScreen.bookmarksTitle', { count: bookmarks.length })}</Text>
                            {bookmarks.length > 0 ? (
                                bookmarks.map((item) => (
                                    <View key={`${item.surahNumber}-${item.verseNumber}`}>
                                        {renderBookmark({ item })}
                                    </View>
                                ))
                            ) : (
                                <Text style={createStyles(theme).emptyText}>{t('profileScreen.noBookmarks')}</Text>
                            )}
                        </View>

                        {/* Last Read Section */}
                        <View style={createStyles(theme).section}>
                            <Text style={createStyles(theme).sectionTitle}>{t('profileScreen.lastReadTitle', { count: lastRead.length })}</Text>
                            {lastRead.length > 0 ? (
                                lastRead.map((item) => (
                                    <View key={`${item.surahNumber}-${item.verseNumber}-${item.timestamp}`}>
                                        {renderLastRead({ item })}
                                    </View>
                                ))
                            ) : (
                                <Text style={createStyles(theme).emptyText}>{t('profileScreen.noLastRead')}</Text>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={createStyles(theme).card}>
                        <Text style={[createStyles(theme).email, { marginBottom: SPACING.md }]}>{t('profileScreen.notSignedIn')}</Text>
                        <TouchableOpacity style={createStyles(theme).googleBtn} onPress={signInWithGoogle}>
                            <Text style={createStyles(theme).googleBtnText}>{t('profileScreen.signInWithGoogle')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView >
        </SafeAreaView >
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
    nameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: FONT_SIZES.large, color: theme.text, fontWeight: '600', flex: 1 },
    email: { fontSize: FONT_SIZES.small, color: theme.secondary },
    editNameButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.sm,
        backgroundColor: theme.surface,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.border,
    },
    editNameButtonText: {
        fontSize: 14,
    },
    editNameContainer: {
        flex: 1,
    },
    nameInput: {
        fontSize: FONT_SIZES.large,
        color: theme.text,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: SPACING.sm,
        backgroundColor: theme.surface,
        marginBottom: SPACING.sm,
    },
    editButtonRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    editButton: {
        flex: 1,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: 6,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
    },
    cancelButtonText: {
        color: theme.textSecondary,
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: theme.primary,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
    },
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
