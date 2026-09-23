import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, ScrollView, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING } from '@/theme';
import { createStyles } from './ProfileScreen.styles';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, userProfile, signOutUser, updateDisplayName, signInWithGoogle } = useAuth();
    const { bookmarks, lastRead, removeBookmark } = useUserData();
    const { theme, common } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);
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
            style={[common.listItem, common.gapSm]}
            onPress={() => handleBookmarkPress(item)}
        >
            <View style={common.flex1}>
                <Text style={[common.textStrong, common.mbXs]}>
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
                <Text style={common.text}>✕</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderLastRead = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[common.listItem, common.gapSm]}
            onPress={() => handleLastReadPress(item)}
        >
            <View style={common.flex1}>
                <Text style={[common.textStrong, common.mbXs]}>
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
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('screenTitles.profile')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
            />

            <ScrollView style={common.listContent}>
                {user ? (
                    <>
                        <View style={common.sectionCard}>
                            <View style={[common.row, common.mbMd]}>
                                {user.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarFallback]}>
                                        <Text style={styles.avatarInitials}>
                                            {(userProfile?.displayName || user.displayName)?.charAt(0) || 'U'}
                                        </Text>
                                    </View>
                                )}
                                <View style={common.flex1}>
                                    {isEditingName ? (
                                        <View style={common.flex1}>
                                            <TextInput
                                                style={styles.nameInput}
                                                value={newDisplayName}
                                                onChangeText={setNewDisplayName}
                                                placeholder={t('profileScreen.namePlaceholder')}
                                                placeholderTextColor={theme.textSecondary}
                                                maxLength={50}
                                                autoFocus
                                            />
                                            <View style={common.rowGap}>
                                                <TouchableOpacity
                                                    style={[styles.editButton, styles.cancelButton]}
                                                    onPress={handleCancelEdit}
                                                    disabled={isUpdating}
                                                >
                                                    <Text style={common.sectionLabel}>{t('profileScreen.cancel')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.editButton, common.buttonPrimary]}
                                                    onPress={handleSaveName}
                                                    disabled={isUpdating}
                                                >
                                                    <Text style={[common.badgeText, common.buttonTextPrimary]}>
                                                        {isUpdating ? t('profileScreen.saving') : t('profileScreen.save')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={[common.row, common.mbXs]}>
                                            <Text style={styles.name}>
                                                {userProfile?.displayName || user.displayName || t('profileScreen.defaultUserName')}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.editNameButton}
                                                onPress={handleEditName}
                                            >
                                                <Text>✏️</Text>
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
                            <Text style={[common.title, common.mbMd]}>{t('profileScreen.bookmarksTitle', { count: bookmarks.length })}</Text>
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
                            <Text style={[common.title, common.mbMd]}>{t('profileScreen.lastReadTitle', { count: lastRead.length })}</Text>
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
                    <View style={common.sectionCard}>
                        <Text style={[styles.email, common.mbMd]}>{t('profileScreen.notSignedIn')}</Text>
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
