import React, { useState, useMemo } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, Platform, ScrollView, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import Constants from 'expo-constants';
import { SPACING } from '../constants';
import { createStyles } from './ProfileScreen.styles';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, userProfile, signOutUser, updateDisplayName, signInWithGoogle } = useAuth();
    const { bookmarks, lastRead, removeBookmark } = useUserData();
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
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
            style={styles.listItem}
            onPress={() => handleBookmarkPress(item)}
        >
            <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>
                    {t('profileScreen.verseLabel', { surahName: item.surahName, verseNumber: item.verseNumber })}
                </Text>
                <Text style={styles.listItemSubtitle} numberOfLines={2}>
                    {item.verseText}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeBookmark(item.id)}
            >
                <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderLastRead = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.listItem}
            onPress={() => handleLastReadPress(item)}
        >
            <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>
                    {t('profileScreen.verseLabel', { surahName: item.surahName, verseNumber: item.verseNumber })}
                </Text>
                <Text style={styles.listItemSubtitle} numberOfLines={2}>
                    {item.verseText}
                </Text>
            </View>
            <Text style={styles.timeText}>
                {new Date(item.timestamp).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'tr-TR')}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <HeaderWithDarkModeToggle
                title={t('screenTitles.profile')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView style={styles.content}>
                {user ? (
                    <>
                        <View style={styles.card}>
                            <View style={styles.avatarRow}>
                                {user.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarFallback]}>
                                        <Text style={styles.avatarInitials}>
                                            {(userProfile?.displayName || user.displayName)?.charAt(0) || 'U'}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.nameFlex}>
                                    {isEditingName ? (
                                        <View style={styles.editNameContainer}>
                                            <TextInput
                                                style={styles.nameInput}
                                                value={newDisplayName}
                                                onChangeText={setNewDisplayName}
                                                placeholder={t('profileScreen.namePlaceholder')}
                                                placeholderTextColor={theme.textSecondary}
                                                maxLength={50}
                                                autoFocus
                                            />
                                            <View style={styles.editButtonRow}>
                                                <TouchableOpacity
                                                    style={[styles.editButton, styles.cancelButton]}
                                                    onPress={handleCancelEdit}
                                                    disabled={isUpdating}
                                                >
                                                    <Text style={styles.cancelButtonText}>{t('profileScreen.cancel')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.editButton, styles.saveButton]}
                                                    onPress={handleSaveName}
                                                    disabled={isUpdating}
                                                >
                                                    <Text style={styles.saveButtonText}>
                                                        {isUpdating ? t('profileScreen.saving') : t('profileScreen.save')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.nameContainer}>
                                            <Text style={styles.name}>
                                                {userProfile?.displayName || user.displayName || t('profileScreen.defaultUserName')}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.editNameButton}
                                                onPress={handleEditName}
                                            >
                                                <Text style={styles.editNameButtonText}>✏️</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    <Text style={styles.email}>{user.email || '—'}</Text>
                                </View>
                            </View>

                            <AppButton
                                title={t('profileScreen.signOut')}
                                onPress={signOutUser}
                                variant="primary"
                                size="medium"
                                style={{ marginTop: SPACING.lg }}
                            />
                        </View>

                        {/* Bookmarks Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('profileScreen.bookmarksTitle', { count: bookmarks.length })}</Text>
                            {bookmarks.length > 0 ? (
                                bookmarks.map((item) => (
                                    <View key={`${item.surahNumber}-${item.verseNumber}`}>
                                        {renderBookmark({ item })}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>{t('profileScreen.noBookmarks')}</Text>
                            )}
                        </View>

                        {/* Last Read Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('profileScreen.lastReadTitle', { count: lastRead.length })}</Text>
                            {lastRead.length > 0 ? (
                                lastRead.map((item) => (
                                    <View key={`${item.surahNumber}-${item.verseNumber}-${item.timestamp}`}>
                                        {renderLastRead({ item })}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>{t('profileScreen.noLastRead')}</Text>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.card}>
                        <Text style={[styles.email, styles.notSignedInText]}>{t('profileScreen.notSignedIn')}</Text>
                        <AppButton
                            title={t('profileScreen.signInWithGoogle')}
                            onPress={signInWithGoogle}
                            variant="primary"
                            size="medium"
                            style={{ backgroundColor: '#DB4437' }}
                        />
                    </View>
                )}
            </ScrollView >
        </SafeAreaView >
    );
};
