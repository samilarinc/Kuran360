import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ArabicText } from '@/components/ArabicText';
import { SearchInput } from '@/components/SearchInput';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { DIVINE_NAMES, DivineName } from '@/data/esmaulHusna';
import { matchesSearch } from '@/utils/searchFold';
import { SPACING } from '@/theme';
import { createStyles } from './EsmaulHusnaScreen.styles';

interface EsmaulHusnaScreenProps {
    navigation: any;
}

/** The 99 names of Allah: a searchable list; a name opens in a sheet with its full meaning. */
export const EsmaulHusnaScreen: React.FC<EsmaulHusnaScreenProps> = ({ navigation }) => {
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);
    const { t, i18n } = useTranslation();
    const [query, setQuery] = useState('');
    // Index into DIVINE_NAMES of the name open in the sheet
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const nameOf = (item: DivineName) => t(`esmaulHusna.names.${item.number}.name`);
    const meaningOf = (item: DivineName) => t(`esmaulHusna.names.${item.number}.meaning`);

    const results = useMemo(
        () => DIVINE_NAMES.filter(item =>
            matchesSearch(query, [String(item.number), item.arabic, nameOf(item), meaningOf(item)])),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [query, i18n.language],
    );

    const renderItem = ({ item }: { item: DivineName }) => (
        <TouchableOpacity
            style={styles.row}
            onPress={() => setOpenIndex(item.number - 1)}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={`${item.number}. ${nameOf(item)}, ${meaningOf(item)}`}
        >
            <View style={styles.number}>
                <Text style={styles.numberText}>{item.number}</Text>
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowName}>{nameOf(item)}</Text>
                <Text style={styles.rowMeaning} numberOfLines={2}>{meaningOf(item)}</Text>
            </View>
            <ArabicText style={styles.rowArabic} numberOfLines={1}>{item.arabic}</ArabicText>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={common.container}>
            <AppHeader
                title={t('esmaulHusna.title')}
                showBackButton
                onBackPress={() => navigation.goBack()}
                showHomeButton
                onHomePress={() => navigation.navigate('Main')}
            />
            <FlatList
                data={results}
                keyExtractor={item => String(item.number)}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={common.divider} />}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.intro}>{t('esmaulHusna.intro')}</Text>
                        <SearchInput
                            value={query}
                            onChangeText={setQuery}
                            onClear={() => setQuery('')}
                            placeholder={t('esmaulHusna.searchPlaceholder')}
                            icon
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                    </View>
                }
                ListEmptyComponent={
                    <View style={common.emptyState}>
                        <Text style={common.emptyStateText}>{t('esmaulHusna.noResults')}</Text>
                    </View>
                }
                ListFooterComponent={
                    results.length > 0 ? <Text style={[common.footerText, common.mtMd]}>{t('esmaulHusna.source')}</Text> : null
                }
            />
            <NameSheet
                index={openIndex}
                onChange={setOpenIndex}
                onClose={() => setOpenIndex(null)}
                nameOf={nameOf}
                meaningOf={meaningOf}
                iconColor={theme.featuredMuted}
            />
        </SafeAreaView>
    );
};

interface NameSheetProps {
    index: number | null;
    onChange: (index: number) => void;
    onClose: () => void;
    nameOf: (item: DivineName) => string;
    meaningOf: (item: DivineName) => string;
    iconColor: string;
}

/** One name large, in gold on the deep green block, with previous/next through all 99. */
const NameSheet: React.FC<NameSheetProps> = ({ index, onChange, onClose, nameOf, meaningOf, iconColor }) => {
    const styles = useThemedStyles(createStyles);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const item = index === null ? null : DIVINE_NAMES[index];
    const last = DIVINE_NAMES.length - 1;

    return (
        <Modal visible={item !== null} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.sheetBackdrop}>
                <Pressable style={styles.sheetDismiss} onPress={onClose} accessibilityLabel={t('esmaulHusna.close')} />
                {item && (
                    <View style={[styles.sheet, { paddingBottom: SPACING.xl + insets.bottom }]}>
                        <View style={styles.sheetTopRow}>
                            <Text style={styles.sheetCounter}>{t('esmaulHusna.counter', { number: item.number, total: DIVINE_NAMES.length })}</Text>
                            <TouchableOpacity
                                style={styles.sheetIconButton}
                                onPress={onClose}
                                accessibilityRole="button"
                                accessibilityLabel={t('esmaulHusna.close')}
                            >
                                <X size={22} color={iconColor} />
                            </TouchableOpacity>
                        </View>
                        <ArabicText style={styles.sheetArabic}>{item.arabic}</ArabicText>
                        <Text style={styles.sheetName}>{nameOf(item)}</Text>
                        <View style={styles.sheetRule} />
                        <Text style={styles.sheetMeaning}>{meaningOf(item)}</Text>
                        <View style={styles.sheetNav}>
                            <TouchableOpacity
                                style={styles.sheetNavButton}
                                // From the first name, previous wraps around to the last
                                onPress={() => onChange(index === 0 ? last : index! - 1)}
                                accessibilityRole="button"
                            >
                                <ChevronLeft size={18} color={iconColor} />
                                <Text style={styles.sheetNavText}>{t('esmaulHusna.previous')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sheetNavButton}
                                onPress={() => onChange(index === last ? 0 : index! + 1)}
                                accessibilityRole="button"
                            >
                                <Text style={styles.sheetNavText}>{t('esmaulHusna.next')}</Text>
                                <ChevronRight size={18} color={iconColor} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};
