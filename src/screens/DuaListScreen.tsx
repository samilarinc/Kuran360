import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DuaListScreenProps {
    onNavigate: () => void;
}

interface DuaItem {
    id: string;
    person: string;
    topic: string;
    isChecked: boolean;
    isPersonal: boolean; // true for personal duas, false for others
}

const STORAGE_KEY = '@dua_list';

export const DuaListScreen: React.FC<DuaListScreenProps> = ({ onNavigate }) => {
    const { theme } = useTheme();
    const [duaList, setDuaList] = useState<DuaItem[]>([]);
    const [newPerson, setNewPerson] = useState('');
    const [newTopic, setNewTopic] = useState('');
    const [showPersonalForm, setShowPersonalForm] = useState(false);
    const [showOthersForm, setShowOthersForm] = useState(false);

    // Load dua list from storage
    React.useEffect(() => {
        const loadDuaList = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setDuaList(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Error loading dua list:', error);
            }
        };
        loadDuaList();
    }, []);

    // Save dua list to storage
    const saveDuaList = async (list: DuaItem[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            setDuaList(list);
        } catch (error) {
            console.error('Error saving dua list:', error);
        }
    };

    const addDua = (isPersonal: boolean) => {
        if (newTopic.trim() === '') {
            Alert.alert('Hata', 'Lütfen bir konu girin');
            return;
        }

        if (!isPersonal && newPerson.trim() === '') {
            Alert.alert('Hata', 'Lütfen bir isim girin');
            return;
        }

        const newDua: DuaItem = {
            id: Date.now().toString(),
            person: isPersonal ? '' : newPerson.trim(),
            topic: newTopic.trim(),
            isChecked: false,
            isPersonal: isPersonal,
        };

        saveDuaList([...duaList, newDua]);
        setNewPerson('');
        setNewTopic('');
        setShowPersonalForm(false);
        setShowOthersForm(false);
    };

    const toggleCheck = (id: string) => {
        const updated = duaList.map(dua =>
            dua.id === id ? { ...dua, isChecked: !dua.isChecked } : dua
        );
        saveDuaList(updated);
    };

    const deleteDua = (id: string) => {
        Alert.alert(
            'Sil',
            'Bu duayı silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        const updated = duaList.filter(dua => dua.id !== id);
                        saveDuaList(updated);
                    },
                },
            ]
        );
    };

    const resetChecks = () => {
        Alert.alert(
            'Sıfırla',
            'Tüm işaretlemeleri sıfırlamak istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sıfırla',
                    onPress: () => {
                        const updated = duaList.map(dua => ({ ...dua, isChecked: false }));
                        saveDuaList(updated);
                    },
                },
            ]
        );
    };

    const personalDuas = duaList.filter(d => d.isPersonal);
    const othersDuas = duaList.filter(d => !d.isPersonal);

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppHeader
                title="Dua Listem"
                showBackButton={true}
                onBackPress={onNavigate}
            />
            <ScrollView style={styles.content}>
                {/* Personal Duas Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            🤲 Kendim İçin Dualarım
                        </Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary }]}
                            onPress={() => setShowPersonalForm(!showPersonalForm)}
                        >
                            <Text style={styles.addButtonText}>
                                {showPersonalForm ? '−' : '+'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showPersonalForm && (
                        <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Dua konusu (örn: Sağlık, kariyer...)"
                                placeholderTextColor={theme.textSecondary}
                                value={newTopic}
                                onChangeText={setNewTopic}
                            />
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                                onPress={() => addDua(true)}
                            >
                                <Text style={styles.submitButtonText}>Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {personalDuas.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            Henüz kişisel dua eklenmedi
                        </Text>
                    ) : (
                        personalDuas.map(dua => (
                            <View
                                key={dua.id}
                                style={[styles.duaItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                            >
                                <TouchableOpacity
                                    style={styles.duaContent}
                                    onPress={() => toggleCheck(dua.id)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        { borderColor: theme.border },
                                        dua.isChecked && { backgroundColor: theme.primary }
                                    ]}>
                                        {dua.isChecked && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <Text style={[
                                        styles.duaText,
                                        { color: theme.text },
                                        dua.isChecked && styles.checkedText
                                    ]}>
                                        {dua.topic}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => deleteDua(dua.id)}
                                    style={styles.deleteButton}
                                >
                                    <Text style={styles.deleteIcon}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* Others Duas Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Başkaları İçin Dualarım
                        </Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary }]}
                            onPress={() => setShowOthersForm(!showOthersForm)}
                        >
                            <Text style={styles.addButtonText}>
                                {showOthersForm ? '−' : '+'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showOthersForm && (
                        <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Kimin için? (örn: Anne, arkadaş...)"
                                placeholderTextColor={theme.textSecondary}
                                value={newPerson}
                                onChangeText={setNewPerson}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Hangi konu? (örn: Sağlık, huzur...)"
                                placeholderTextColor={theme.textSecondary}
                                value={newTopic}
                                onChangeText={setNewTopic}
                            />
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                                onPress={() => addDua(false)}
                            >
                                <Text style={styles.submitButtonText}>Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {othersDuas.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            Henüz başkaları için dua eklenmedi
                        </Text>
                    ) : (
                        othersDuas.map(dua => (
                            <View
                                key={dua.id}
                                style={[styles.duaItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                            >
                                <TouchableOpacity
                                    style={styles.duaContent}
                                    onPress={() => toggleCheck(dua.id)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        { borderColor: theme.border },
                                        dua.isChecked && { backgroundColor: theme.primary }
                                    ]}>
                                        {dua.isChecked && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <View style={styles.duaTextContainer}>
                                        <Text style={[styles.duaPerson, { color: theme.primary }]}>
                                            {dua.person}
                                        </Text>
                                        <Text style={[
                                            styles.duaText,
                                            { color: theme.text },
                                            dua.isChecked && styles.checkedText
                                        ]}>
                                            {dua.topic}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => deleteDua(dua.id)}
                                    style={styles.deleteButton}
                                >
                                    <Text style={styles.deleteIcon}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    form: {
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.md,
        borderWidth: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        fontSize: FONT_SIZES.medium,
    },
    submitButton: {
        borderRadius: 8,
        padding: SPACING.md,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: FONT_SIZES.medium,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: SPACING.lg,
    },
    duaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        borderWidth: 1,
    },
    duaContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    duaTextContainer: {
        flex: 1,
    },
    duaPerson: {
        fontSize: FONT_SIZES.large,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    duaText: {
        fontSize: FONT_SIZES.medium,
    },
    checkedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    deleteButton: {
        padding: SPACING.sm,
    },
    deleteIcon: {
        fontSize: 18,
        color: '#666',
    },
    resetButton: {
        borderRadius: 12,
        padding: SPACING.md,
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.medium,
        fontWeight: 'bold',
    },
});
