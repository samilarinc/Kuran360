import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, ScrollView, TextInput, Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { MenuListRow } from '@/components/MenuListRow';
import { isAdminUid } from '@/constants/admin';
import { Bug, CloudUpload } from 'lucide-react-native';
import { GoogleLogo } from '@/components/GoogleLogo';
import { RADIUS, SPACING } from '@/theme';
import { createStyles } from './ProfileScreen.styles';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const {
        user, userProfile, signOutUser, updateDisplayName, signInWithGoogle, signInWithApple,
        appleSignInAvailable, googleSignInAvailable, deleteAccount,
    } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const { bookmarks, lastRead, removeBookmark } = useUserData();
    const { theme, common, isDarkMode } = useTheme();
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

    const runDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteAccount();
            if (result === 'deleted') {
                Alert.alert(t('profileScreen.deleteAccountDoneTitle'), t('profileScreen.deleteAccountDoneMessage'));
            } else if (result === 'reauth') {
                Alert.alert(t('profileScreen.deleteAccountReauthTitle'), t('profileScreen.deleteAccountReauthMessage'), [
                    { text: t('profileScreen.cancel'), style: 'cancel' },
                    { text: t('profileScreen.signInAgain'), onPress: signInWithGoogle },
                ]);
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert(t('profileScreen.nameEmptyTitle'), t('profileScreen.deleteAccountErrorMessage'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAccount = () => {
        if (Platform.OS === 'web') {
            if ((globalThis as any).confirm?.(t('profileScreen.deleteAccountConfirm'))) runDeleteAccount();
            return;
        }
        Alert.alert(t('profileScreen.deleteAccountTitle'), t('profileScreen.deleteAccountConfirm'), [
            { text: t('profileScreen.cancel'), style: 'cancel' },
            { text: t('profileScreen.deleteAccount'), style: 'destructive', onPress: runDeleteAccount },
        ]);
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
                            <AppButton
                                title={t('profileScreen.deleteAccount')}
                                onPress={handleDeleteAccount}
                                variant="ghost"
                                size="small"
                                loading={isDeleting}
                                disabled={isDeleting}
                                style={common.mtMd}
                            />
                        </View>

                        <MenuListRow
                            variant="card"
                            icon={<Bug size={26} color={theme.primary} />}
                            iconColor={theme.primary + '15'}
                            title={isAdminUid(user.uid) ? t('profileScreen.bugReports') : t('profileScreen.myBugReports')}
                            subtitle={isAdminUid(user.uid) ? t('profileScreen.bugReportsSubtitle') : t('profileScreen.myBugReportsSubtitle')}
                            onPress={() => navigation.navigate('BugReports')}
                            containerStyle={common.mtMd}
                        />

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
                    <View style={[common.sectionCard, styles.signInCard]}>
                        <View style={styles.signInIcon}>
                            <CloudUpload size={26} color={theme.featuredIcon} />
                        </View>
                        <Text style={styles.signInTitle}>{t('profileScreen.signInTitle')}</Text>
                        <Text style={styles.signInText}>{t('profileScreen.signInText')}</Text>
                        <View style={styles.signInButtons}>
                            {appleSignInAvailable && (
                                <AppleAuthentication.AppleAuthenticationButton
                                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                    buttonStyle={isDarkMode
                                        ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                                        : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                    cornerRadius={RADIUS.md}
                                    style={styles.appleButton}
                                    onPress={signInWithApple}
                                />
                            )}
                            {googleSignInAvailable && (
                                <TouchableOpacity
                                    style={styles.googleButton}
                                    onPress={signInWithGoogle}
                                    activeOpacity={0.8}
                                    accessibilityRole="button"
                                >
                                    <GoogleLogo size={18} />
                                    <Text style={styles.googleButtonText}>{t('profileScreen.signInWithGoogle')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView >
        </SafeAreaView >
    );
};
