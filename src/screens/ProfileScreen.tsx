import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Platform, ScrollView, FlatList, TextInput, Alert } from 'react-native';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '../constants';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, userProfile, signOutUser, updateDisplayName, signInWithGoogle } = useAuth();
    const { theme } = useTheme();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditName = () => {
        setNewDisplayName(userProfile?.displayName || user?.displayName || '');
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        if (!newDisplayName.trim()) {
            Alert.alert('Hata', 'Kullanıcı adı boş olamaz.');
            return;
        }

        if (newDisplayName.trim().length < 2) {
            Alert.alert('Hata', 'Kullanıcı adı en az 2 karakter olmalıdır.');
            return;
        }

        try {
            setIsUpdating(true);
            await updateDisplayName(newDisplayName.trim());
            setIsEditingName(false);
            Alert.alert('Başarılı', 'Kullanıcı adınız güncellendi.');
        } catch (error) {
            console.error('Error updating name:', error);
            Alert.alert('Hata', 'Kullanıcı adı güncellenirken bir hata oluştu.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <SafeAreaView style={createStyles(theme).container}>
            <HeaderWithDarkModeToggle title="Profil" showBackButton onBackPress={() => navigation.goBack()} />

            <View style={createStyles(theme).content}>
                {user ? (
                    <View style={createStyles(theme).card}>
                        <View style={createStyles(theme).avatarRow}>
                            {(userProfile?.photoURL || user?.photoURL) ? (
                                <Image 
                                    source={{ uri: (userProfile?.photoURL || user?.photoURL) as string }} 
                                    style={createStyles(theme).avatar} 
                                />
                            ) : (
                                <View style={[createStyles(theme).avatar, createStyles(theme).avatarFallback]}>
                                    <Text style={createStyles(theme).avatarInitials}>
                                        {(userProfile?.displayName || user?.displayName)?.charAt(0) || 'U'}
                                    </Text>
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={createStyles(theme).name}>
                                    {userProfile?.displayName || user?.displayName || 'İsimsiz Kullanıcı'}
                                </Text>
                                <Text style={createStyles(theme).email}>
                                    {userProfile?.email || user?.email || '—'}
                                </Text>
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
