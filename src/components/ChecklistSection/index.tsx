import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '@/contexts/ThemeContext';
import { ChecklistItem } from '@/components/ChecklistItem';
import { ProgressBar } from '@/components/ProgressBar';
import { CustomChecklistItem } from '@/utils/umrahTrip';
import { SPACING, FONT_SIZES, RADIUS, Theme } from '@/theme';

export interface ChecklistGroup {
    key: string;
    itemKeys: string[];
}

interface ChecklistSectionProps {
    groups: ChecklistGroup[];
    checklist: Record<string, boolean>;
    customItems: CustomChecklistItem[];
    onToggleItem: (key: string) => void;
    onAddCustom: (text: string) => void;
    onRemoveCustom: (id: string) => void;
    /** Optional line under a built-in item (e.g. "required for the Umrah permit") */
    renderHint?: (key: string) => React.ReactNode;
    /** Optional links on the right of a built-in item (e.g. e-visa site, Nusuk store page) */
    renderLinks?: (key: string) => React.ReactNode;
}

/** Custom items share the checklist dict with built-in ones under this prefix */
export const customKey = (id: string) => `custom:${id}`;

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
    groups, checklist, customItems, onToggleItem, onAddCustom, onRemoveCustom, renderHint, renderLinks,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);
    const [draft, setDraft] = useState('');

    const allKeys = [...groups.flatMap((g) => g.itemKeys), ...customItems.map((c) => customKey(c.id))];
    const done = allKeys.filter((k) => checklist[k]).length;
    const total = allKeys.length;

    const submit = () => {
        const text = draft.trim();
        if (!text) return;
        onAddCustom(text);
        setDraft('');
    };

    const renderRow = (key: string, label: string, isLast: boolean, extra?: { hint?: React.ReactNode; trailing?: React.ReactNode }) => (
        <ChecklistItem
            key={key}
            checked={!!checklist[key]}
            onToggle={() => onToggleItem(key)}
            style={[styles.row, isLast && styles.rowLast]}
            trailing={extra?.trailing}
        >
            <View style={common.flex1}>
                <Text style={[common.text, checklist[key] && common.checkedText]}>{label}</Text>
                {extra?.hint}
            </View>
        </ChecklistItem>
    );

    return (
        <View style={common.mbXl}>
            <View style={styles.header}>
                <Text style={common.titleLarge}>{t('umrahChecklistScreen.checklistTitle')}</Text>
                <Text style={styles.count}>{t('umrahChecklistScreen.progress', { done, total })}</Text>
            </View>
            <ProgressBar progress={total ? (done / total) * 100 : 0} height={4} fillColor={theme.accent} style={common.mbLg} />

            {groups.map((group) => (
                <View key={group.key} style={common.mbLg}>
                    <Text style={common.groupLabel}>{t(`umrahChecklistScreen.groups.${group.key}`)}</Text>
                    <View style={common.groupCard}>
                        {group.itemKeys.map((key, i) =>
                            renderRow(key, t(`umrahChecklistScreen.items.${key}`), i === group.itemKeys.length - 1, {
                                hint: renderHint?.(key),
                                trailing: renderLinks?.(key),
                            }),
                        )}
                    </View>
                </View>
            ))}

            <Text style={common.groupLabel}>{t('umrahChecklistScreen.groups.custom')}</Text>
            <View style={common.groupCard}>
                {customItems.map((item) =>
                    renderRow(customKey(item.id), item.text, false, {
                        trailing: (
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => onRemoveCustom(item.id)}
                                accessibilityRole="button"
                                accessibilityLabel={t('umrahChecklistScreen.removeItem', { item: item.text })}
                                hitSlop={8}
                            >
                                <X size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        ),
                    }),
                )}
                <View style={styles.addRow}>
                    <TextInput
                        style={styles.addInput}
                        value={draft}
                        onChangeText={setDraft}
                        onSubmitEditing={submit}
                        placeholder={t('umrahChecklistScreen.addPlaceholder')}
                        placeholderTextColor={theme.textSecondary}
                        returnKeyType="done"
                        blurOnSubmit={false}
                        maxLength={120}
                    />
                    <TouchableOpacity
                        style={[styles.addButton, !draft.trim() && common.disabled]}
                        onPress={submit}
                        disabled={!draft.trim()}
                        accessibilityRole="button"
                        accessibilityLabel={t('umrahChecklistScreen.addItem')}
                    >
                        <Plus size={16} color={theme.headerText} />
                        <Text style={styles.addButtonText}>{t('umrahChecklistScreen.addItem')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

/** A small outlined link that sits on the right of a checklist row, e.g. the official site for that task */
export const ChecklistLink: React.FC<{ label: string; icon?: React.ReactNode; onPress: () => void }> = ({ label, icon, onPress }) => {
    const styles = useThemedStyles(createStyles);
    return (
        <TouchableOpacity style={styles.link} onPress={onPress} accessibilityRole="link" hitSlop={4}>
            {icon}
            <Text style={styles.linkText}>{label}</Text>
        </TouchableOpacity>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    link: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: theme.border,
    },
    linkText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.iconPrimary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    count: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    // A ChecklistItem flattened into a row of a groupCard: hairline between rows instead of separate cards
    row: {
        marginBottom: 0,
        borderWidth: 0,
        borderRadius: 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
        backgroundColor: 'transparent',
        paddingVertical: 12,
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    iconButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.sm,
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.sm,
        paddingLeft: SPACING.md,
    },
    addInput: {
        flex: 1,
        fontSize: FONT_SIZES.medium,
        paddingVertical: SPACING.sm,
        color: theme.text,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.sm,
        backgroundColor: theme.primary,
    },
    addButtonText: {
        fontSize: FONT_SIZES.small,
        fontWeight: '600',
        color: theme.headerText,
    },
});
