import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Modal,
    SafeAreaView,
    Platform,
    Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { HatimService } from '../services/HatimService';
import { Hatim } from '../types';
import { SPACING, FONT_SIZES } from '../constants';

interface HatimScreenProps {
    navigation: any;
}

export const HatimScreen: React.FC<HatimScreenProps> = ({ navigation }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [hatims, setHatims] = useState<Hatim[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDeadline, setNewDeadline] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [creating, setCreating] = useState(false);
    const [hasDeadline, setHasDeadline] = useState(false);

    const fetchHatims = async () => {
        try {
            setLoading(true);
            const data = await HatimService.getHatims();
            setHatims(data);
        } catch (error) {
            console.error('Error fetching hatims:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHatims();
    }, []);

    const handleCreate = async () => {
        if (!newTitle.trim() || !user) return;
        try {
            setCreating(true);
            const deadline = hasDeadline && newDeadline ? newDeadline.getTime() : undefined;
            await HatimService.createHatim(newTitle, newDesc, user.uid, user.displayName || 'İsimsiz', deadline);
            setNewTitle('');
            setNewDesc('');
            setNewDeadline(null);
            setModalVisible(false);
            setHasDeadline(false);
            fetchHatims();
        } catch (error) {
            console.error('Error creating hatim:', error);
        } finally {
            setCreating(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const currentDeadline = newDeadline || new Date();
            currentDeadline.setFullYear(selectedDate.getFullYear());
            currentDeadline.setMonth(selectedDate.getMonth());
            currentDeadline.setDate(selectedDate.getDate());
            setNewDeadline(new Date(currentDeadline));
            if (Platform.OS !== 'ios') setShowTimePicker(true);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            const currentDeadline = newDeadline || new Date();
            currentDeadline.setHours(selectedTime.getHours());
            currentDeadline.setMinutes(selectedTime.getMinutes());
            setNewDeadline(new Date(currentDeadline));
        }
    };

    const renderHatimItem = ({ item }: { item: Hatim }) => {
        const completedParts = item.parts.filter(p => p.isCompleted).length;
        const progress = (completedParts / 30) * 100;

        return (
            <TouchableOpacity
                style={[styles.hatimCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                onPress={() => navigation.navigate('HatimDetail', { hatimId: item.id })}
            >
                <View style={styles.hatimHeader}>
                    <Text style={[styles.hatimTitle, { color: theme.text }]}>{item.title}</Text>
                    {item.isCompleted && (
                        <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>Tamamlandı</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.hatimCreator, { color: theme.textSecondary }]}>
                    Oluşturan: {item.creatorName}
                </Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                        {completedParts} / 30 Cüz
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.primary }]}>‹ Geri</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Hatimler</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Text style={[styles.addIcon, { color: theme.primary }]}>+</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <View style={{ flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center' }}>
                    <FlatList
                        data={hatims}
                        renderItem={renderHatimItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    Henüz hatim bulunmuyor. İlkini siz oluşturun!
                                </Text>
                            </View>
                        }
                    />
                </View>
            )}

            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Yeni Hatim Oluştur</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                            placeholder="Hatim Başlığı"
                            placeholderTextColor={theme.textSecondary}
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
                            placeholder="Açıklama (Opsiyonel)"
                            placeholderTextColor={theme.textSecondary}
                            value={newDesc}
                            onChangeText={setNewDesc}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={styles.toggleRow}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 0 }]}>Bitiş Tarihi Belirle</Text>
                            <Switch
                                value={hasDeadline}
                                onValueChange={setHasDeadline}
                                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                                thumbColor={hasDeadline ? theme.primary : '#f4f3f4'}
                            />
                        </View>

                        {hasDeadline && (
                            <>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Son Katılım Tarihi</Text>

                                {Platform.OS === 'web' ? (
                                    <View style={{ marginBottom: 16 }}>
                                        <input
                                            type="date"
                                            style={{
                                                width: '100%',
                                                padding: 12,
                                                borderRadius: 12,
                                                border: `1px solid ${theme.border}`,
                                                backgroundColor: 'transparent',
                                                color: theme.text,
                                                marginBottom: 8,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: '16px'
                                            }}
                                            onChange={(e: any) => {
                                                const val = e.target.value;
                                                if (!val) return;
                                                const [y, m, d] = val.split('-').map(Number);
                                                const current = newDeadline || new Date();
                                                current.setFullYear(y);
                                                current.setMonth(m - 1);
                                                current.setDate(d);
                                                setNewDeadline(new Date(current));
                                            }}
                                            value={newDeadline ? newDeadline.toISOString().split('T')[0] : ''}
                                        />
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <select
                                                style={{
                                                    flex: 1,
                                                    padding: 12,
                                                    borderRadius: 12,
                                                    border: `1px solid ${theme.border}`,
                                                    backgroundColor: 'transparent',
                                                    color: theme.text,
                                                    outline: 'none',
                                                    fontFamily: 'inherit',
                                                    fontSize: '16px',
                                                    appearance: 'auto'
                                                }}
                                                onChange={(e: any) => {
                                                    const h = parseInt(e.target.value);
                                                    const current = newDeadline || new Date();
                                                    current.setHours(h);
                                                    setNewDeadline(new Date(current));
                                                }}
                                                value={newDeadline ? newDeadline.getHours() : 0}
                                            >
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                            <Text style={{ marginHorizontal: 8, color: theme.text, fontSize: 18, fontWeight: '700' }}>:</Text>
                                            <select
                                                style={{
                                                    flex: 1,
                                                    padding: 12,
                                                    borderRadius: 12,
                                                    border: `1px solid ${theme.border}`,
                                                    backgroundColor: 'transparent',
                                                    color: theme.text,
                                                    outline: 'none',
                                                    fontFamily: 'inherit',
                                                    fontSize: '16px',
                                                    appearance: 'auto'
                                                }}
                                                onChange={(e: any) => {
                                                    const m = parseInt(e.target.value);
                                                    const current = newDeadline || new Date();
                                                    current.setMinutes(m);
                                                    setNewDeadline(new Date(current));
                                                }}
                                                value={newDeadline ? newDeadline.getMinutes() : 0}
                                            >
                                                {Array.from({ length: 60 }, (_, i) => (
                                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </View>
                                    </View>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.input, { borderColor: theme.border, justifyContent: 'center' }]}
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Text style={{ color: newDeadline ? theme.text : theme.textSecondary }}>
                                                {newDeadline
                                                    ? newDeadline.toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                    : 'Tarih ve Saat Seçin'}
                                            </Text>
                                        </TouchableOpacity>

                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={newDeadline || new Date()}
                                                mode="date"
                                                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                                                onChange={onDateChange}
                                                minimumDate={new Date()}
                                                is24Hour={true}
                                                locale="tr-TR"
                                            />
                                        )}

                                        {showTimePicker && (
                                            <DateTimePicker
                                                value={newDeadline || new Date()}
                                                mode="time"
                                                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                                                onChange={onTimeChange}
                                                is24Hour={true}
                                                locale="tr-TR"
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: theme.text }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                onPress={handleCreate}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff' }}>Oluştur</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: SPACING.sm,
    },
    backText: {
        fontSize: FONT_SIZES.medium,
        fontWeight: '600',
    },
    title: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
    },
    addButton: {
        padding: SPACING.sm,
    },
    addIcon: {
        fontSize: 32,
        fontWeight: '300',
    },
    listContent: {
        padding: SPACING.lg,
    },
    hatimCard: {
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: SPACING.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    hatimHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    hatimTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '600',
    },
    completedBadge: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    completedBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    hatimCreator: {
        fontSize: FONT_SIZES.small,
        marginBottom: SPACING.md,
    },
    progressContainer: {
        marginTop: SPACING.sm,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: SPACING.xs,
    },
    progressFill: {
        height: '100%',
    },
    progressText: {
        fontSize: 12,
        textAlign: 'right',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: FONT_SIZES.medium,
        opacity: 0.7,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        padding: SPACING.xl,
        borderRadius: 24,
        elevation: 5,
    },
    modalTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: '700',
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: SPACING.sm,
    },
    modalButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        marginLeft: SPACING.md,
        minWidth: 80,
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        marginTop: SPACING.sm,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingVertical: SPACING.xs,
    },
});
