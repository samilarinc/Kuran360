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
                showHomeButton={true}
                onHomePress={() => navigation.navigate('Main')}
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

                <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Teknik Detaylar</Text>

                    <Text style={[styles.techSubtitle, { color: theme.text }]}>SQLite Veritabanı (Mobil)</Text>
                    <View style={styles.updateList}>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Composite primary key yapısı: (surah_number, verse_number)</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Otomatik indexleme ile hızlı sorgular</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Transaction-based batch insert (100 adet/batch)</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• İlk çalıştırmada sunucudan veri indirme</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• AsyncStorage boyut limiti sorunları çözüldü</Text>
                    </View>

                    <Text style={[styles.techSubtitle, { color: theme.text }]}>IndexedDB (Web)</Text>
                    <View style={styles.updateList}>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Ayetler tekil olarak saklanıyor</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Cursor-based verimli sorgulama</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Metadata store ile versiyon kontrolü</Text>
                    </View>

                    <Text style={[styles.techSubtitle, { color: theme.text }]}>Veri Akışı</Text>
                    <View style={styles.updateList}>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Sunucu: https://kuran360.com/allVerses.json</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• On-demand verse loading için optimize edildi</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Audio streaming tüm platformlarda destekleniyor</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• APK boyutu küçültüldü (bundled data kaldırıldı)</Text>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Bilinen Hatalar ve Planlanan Güncellemeler</Text>

                    <View style={styles.updateList}>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Kelime çevirisi açılınca kelime anlamı olmayanlar görünmüyor, örnek: İnşirah ilk ayet</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Kuran sayfası görünümü eklenecek</Text>
                        <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Sayfa sesleri eklenecek, ayrıca 30. cüzdeki sayfadan daha kısa sureler için sesler üretilmeli</Text>
                    </View>
                </View>


                <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Güncelleme Notları</Text>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>22 Şubat 2026</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Umre Desteği: "Şu an neredeyim?" ekranı ile tavaf ve sa'y takibi eklendi.</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Dua Listem: Kişisel ve başkaları için özel dua çizelgesi özelliği eklendi.</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Umre Duaları: İhram, tavaf, sa'y ve diğer umre ibadet dualarını kapsayan rehber eklendi.</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Hazırlık Listesi: Gidiş/dönüş uçuş bilgileri, platform-uyumlu tarih seçici (web/mobil), otomatik Skyscanner entegrasyonu.</Text>
                        </View>
                    </View>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>12 Şubat 2026</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• PWA Desteği: Web uygulaması artık Progressive Web App olarak cihazlara kurulabilir ve offline çalışabilir.</Text>
                        </View>
                    </View>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>12 Ocak 2026</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Yeni Mealler: Kürtçe (Kurmancî) Latin ve Arap harfli Diyanet mealleri ile Ömer Çelik Meali sisteme eklendi.</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Veri Altyapısı: Versiyon bazlı dinamik meal listeleme ve büyük veri dosyaları için yeni işleme motoru entegre edildi.</Text>
                        </View>
                    </View>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>26 Aralık 2025</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Hatim Sayfası: Kullanıcıların birlikte hatim indirebileceği interaktif hatim sistemi eklendi.</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Namaz Vakitleri: 2025 yılı için tüm Türkiye il ve ilçelerini kapsayan, konuma duyarlı ezan vakitleri eklendi.</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Cuma Hutbesi: Haftalık cuma hutbelerinin PDF formatında okunabileceği özel bölüm eklendi.</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Konum Servisleri: GPS tabanlı otomatik konum tespiti ve manuel şehir/ilçe seçimi entegre edildi.</Text>
                        </View>
                    </View>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>16 Aralık 2024</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• SQLite veritabanı desteği eklendi (Android/iOS)</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Composite primary key ile (sure, ayet) hızlı sorgulama</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Transaction-based batch insert operasyonları</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• IndexedDB veri yapısı tamamen yenilendi - ayetler artık tekil olarak saklanıyor</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Veri indirme progress bar'ı gerçek zamanlı byte gösterimi ile güncellendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Sure listesine arama özelliği eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• URL yapısı iyileştirildi - okunan ayet URL'de görünüyor</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Rastgele ayet ve favori kaldırma emoji'leri güncellendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Favori kaldırma butonu hatası düzeltildi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• AsyncStorage size limit sorunları çözüldü</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Performans iyileştirmeleri ve memory optimizasyonu</Text>
                        </View>
                    </View>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>19 Eylül 2025</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Rastgele ayet sayfası kaydırma fixlendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Ses önizleme hatası düzeltildi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Header ve Footer küçültüldü, alttaki instruction kaldırıldı</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Bütün mealleri göster tuşu eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Bütün mealleri göster sayfasına farklı meal ile ayet paylaşma eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Bütün sayfalara home butonu eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Resim oluşturmada farklı modlar ve boyutlarda fotoğraf üretme seçeneği eklendi</Text>
                        </View>
                    </View>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>10 Eylül 2025</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Google Analytics eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Ayet paylaşma eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Resimli ayet paylaşma eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Dark Mode ayet paylaşma eklendi</Text>
                        </View>
                    </View>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>06 Eylül 2025</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Rastgele ayet sayfası eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Ezber moduna "Ayet Ayet" seçeneği eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Okuyucu seçiminde ses önizleme özelliği eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Sayfalı görünümde dinamik sayfa göstergesi eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Ayete git butonunda toplam ayet sayısı gösterimi eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Ayete git modal'ında favori meal desteği düzeltildi</Text>
                        </View>
                    </View>

                    <View style={styles.updateItem}>
                        <Text style={[styles.updateDate, { color: theme.text }]}>05 Eylül 2025</Text>
                        <View style={styles.updateList}>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Hakkında sayfasına güncelleme notları eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Yeni kariler eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Ezber modu için tekrar sayısı özelliği eklendi</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• Audio oynatıcı performans iyileştirmeleri</Text>
                            <Text style={[styles.updateBullet, { color: theme.textSecondary }]}>• UI geliştirmeleri ve hata düzeltmeleri</Text>
                        </View>
                    </View>
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
    updateItem: {
        marginBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        paddingBottom: SPACING.md,
    },
    updateDate: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    updateList: {
        paddingLeft: SPACING.xs,
    },
    updateBullet: {
        fontSize: FONT_SIZES.small,
        lineHeight: 22,
        marginBottom: SPACING.xs,
    },
    techSubtitle: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
        marginTop: SPACING.md,
        marginBottom: SPACING.xs,
    },
});
