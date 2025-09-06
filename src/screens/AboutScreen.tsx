import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';

interface AboutScreenProps {
    navigation: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <HeaderWithDarkModeToggle
                title="Hakkında"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
            />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                        <Image
                            source={require('../../public/favicon.png')}
                            style={{ width: 56, height: 56, borderRadius: 28 }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.name, { color: theme.text }]}>Muhammed Şamil Arınç</Text>
                    <Text style={[styles.role, { color: theme.secondary }]}>Tasarımcı</Text>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.infoRow}
                        onPress={() => Linking.openURL('mailto:msamilarinc@gmail.com')}
                        activeOpacity={0.7}
                    >
                        <Octicons name="mail" size={18} color={theme.primary} style={{ marginRight: SPACING.sm }} />
                        <Text style={[styles.infoText, { color: theme.text }]}>
                            msamilarinc@gmail.com
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.infoRow}
                        onPress={() => Linking.openURL('https://github.com/samilarinc')}
                        activeOpacity={0.7}
                    >
                        <Octicons name="mark-github" size={18} color={theme.primary} style={{ marginRight: SPACING.sm }} />
                        <Text style={[styles.infoText, { color: theme.primary, textDecorationLine: 'underline' }]}>github.com/samilarinc</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.infoRow}
                        onPress={() => Linking.openURL('https://www.linkedin.comin/samil-arinc/')}
                        activeOpacity={0.7}
                    >
                        <Octicons name="link" size={18} color={theme.primary} style={{ marginRight: SPACING.sm }} />
                        <Text style={[styles.infoText, { color: theme.primary, textDecorationLine: 'underline' }]}>linkedin.com/in/samil-arinc</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Proje Hakkında</Text>
                    <Text style={[styles.sectionText, { color: theme.textSecondary }]}>Bu uygulama tamamen kişisel bir projedir ve herhangi bir ticari/kar amacı yoktur. Projenin ilerleyen aşamalarında açık kaynak olarak paylaşılması planlanmaktadır.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        alignItems: 'center',
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
    },
    title: {
        fontSize: FONT_SIZES.xlarge,
        fontWeight: '700',
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    card: {
        borderRadius: 16,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        width: '100%',
        borderWidth: 1,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    name: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    role: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '500',
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    bio: {
        fontSize: FONT_SIZES.small,
        textAlign: 'center',
        marginBottom: SPACING.md,
        opacity: 0.85,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginVertical: SPACING.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    infoIcon: {
        fontSize: 16,
        marginRight: SPACING.sm,
    },
    infoText: {
        fontSize: FONT_SIZES.small,
    },
    section: {
        borderRadius: 12,
        padding: SPACING.lg,
        borderWidth: 1,
        width: '100%',
    },
    sectionTitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    sectionText: {
        fontSize: FONT_SIZES.small,
        lineHeight: 20,
    },
    contactSection: {
        marginBottom: SPACING.sm,
        alignItems: 'center',
    },
    socialSection: {
        marginBottom: SPACING.sm,
        alignItems: 'center',
    },
    contactLabel: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: FONT_SIZES.small,
        fontWeight: '400',
        textAlign: 'center',
    },
    placeholder: {
        fontSize: FONT_SIZES.small,
        textAlign: 'center',
        marginTop: SPACING.md,
        opacity: 0.7,
    },
});
