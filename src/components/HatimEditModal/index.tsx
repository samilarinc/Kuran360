import React from 'react';
import { View, Text, Modal, TextInput, Switch, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme, CommonStyles, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, Theme } from '@/theme';
import { AppButton } from '@/components/AppButton';

interface HatimEditModalProps {
    visible: boolean;
    title: string;
    description: string;
    hasDeadline: boolean;
    deadline: Date | null;
    isPrivate: boolean;
    isLocked: boolean;
    isUpdating: boolean;
    showDatePicker: boolean;
    showTimePicker: boolean;
    onChangeTitle: (value: string) => void;
    onChangeDescription: (value: string) => void;
    onToggleHasDeadline: (value: boolean) => void;
    onChangeDeadline: (date: Date) => void;
    onTogglePrivate: (value: boolean) => void;
    onToggleLocked: (value: boolean) => void;
    onRequestDatePicker: () => void;
    onDateChange: (event: any, selectedDate?: Date) => void;
    onTimeChange: (event: any, selectedTime?: Date) => void;
    onClose: () => void;
    onUpdate: () => void;
    onDelete: () => void;
}

export const HatimEditModal: React.FC<HatimEditModalProps> = ({
    visible,
    title,
    description,
    hasDeadline,
    deadline,
    isPrivate,
    isLocked,
    isUpdating,
    showDatePicker,
    showTimePicker,
    onChangeTitle,
    onChangeDescription,
    onToggleHasDeadline,
    onChangeDeadline,
    onTogglePrivate,
    onToggleLocked,
    onRequestDatePicker,
    onDateChange,
    onTimeChange,
    onClose,
    onUpdate,
    onDelete,
}) => {
    const { theme, common } = useTheme();
    const { t, i18n } = useTranslation();
    const styles = useThemedStyles(createStyles);

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={common.modalOverlay}>
                <View style={common.modalContent}>
                    <Text style={common.modalTitle}>{t('hatimDetailScreen.editTitle')}</Text>

                    <TextInput
                        style={common.input}
                        placeholder={t('hatimDetailScreen.titlePlaceholder')}
                        placeholderTextColor={theme.textSecondary}
                        value={title}
                        onChangeText={onChangeTitle}
                    />

                    <TextInput
                        style={[common.input, common.textArea]}
                        placeholder={t('hatimDetailScreen.descriptionPlaceholder')}
                        placeholderTextColor={theme.textSecondary}
                        value={description}
                        onChangeText={onChangeDescription}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={common.toggleRow}>
                        <Text style={[styles.inputLabel, styles.inputLabelNoMarginTop]}>{t('hatimDetailScreen.setDeadline')}</Text>
                        <Switch
                            value={hasDeadline}
                            onValueChange={onToggleHasDeadline}
                            trackColor={{ false: theme.border, true: theme.primary + '80' }}
                            thumbColor={hasDeadline ? theme.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={common.toggleRow}>
                        <Text style={[styles.inputLabel, styles.inputLabelNoMarginTop]}>{t('hatimDetailScreen.privateHatim')}</Text>
                        <Switch
                            value={isPrivate}
                            onValueChange={onTogglePrivate}
                            trackColor={{ false: theme.border, true: theme.primary + '80' }}
                            thumbColor={isPrivate ? theme.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={common.toggleRow}>
                        <Text style={[styles.inputLabel, styles.inputLabelNoMarginTop]}>{t('hatimDetailScreen.lockHatim')}</Text>
                        <Switch
                            value={isLocked}
                            onValueChange={onToggleLocked}
                            trackColor={{ false: theme.border, true: '#607D8B' }}
                            thumbColor={isLocked ? '#455A64' : '#f4f3f4'}
                        />
                    </View>

                    {hasDeadline && (
                        <>
                            <Text style={styles.inputLabel}>{t('hatimDetailScreen.deadlineLabel')}</Text>

                            {Platform.OS === 'web' ? (
                                <View style={common.mbMd}>
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
                                            const current = deadline || new Date();
                                            current.setFullYear(y);
                                            current.setMonth(m - 1);
                                            current.setDate(d);
                                            onChangeDeadline(new Date(current));
                                        }}
                                        value={deadline ? deadline.toISOString().split('T')[0] : ''}
                                    />
                                    <View style={common.row}>
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
                                                const h = parseInt(e.target.value, 10);
                                                const current = deadline || new Date();
                                                current.setHours(h);
                                                onChangeDeadline(new Date(current));
                                            }}
                                            value={deadline ? deadline.getHours() : 0}
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <Text style={common.timeSeparator}>:</Text>
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
                                                const m = parseInt(e.target.value, 10);
                                                const current = deadline || new Date();
                                                current.setMinutes(m);
                                                onChangeDeadline(new Date(current));
                                            }}
                                            value={deadline ? deadline.getMinutes() : 0}
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
                                        style={styles.editInputStyle}
                                        onPress={onRequestDatePicker}
                                    >
                                        <Text style={deadline ? common.text : common.subtitle}>
                                            {deadline
                                                ? deadline.toLocaleString(i18n.language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                : t('hatimDetailScreen.selectDateTime')}
                                        </Text>
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={deadline || new Date()}
                                            mode="date"
                                            display={Platform.OS === 'android' ? 'spinner' : 'default'}
                                            onChange={onDateChange}
                                            minimumDate={new Date()}
                                            is24Hour={true}
                                            locale={i18n.language === 'en' ? 'en-US' : 'tr-TR'}
                                        />
                                    )}

                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={deadline || new Date()}
                                            mode="time"
                                            display={Platform.OS === 'android' ? 'spinner' : 'default'}
                                            onChange={onTimeChange}
                                            is24Hour={true}
                                            locale={i18n.language === 'en' ? 'en-US' : 'tr-TR'}
                                        />
                                    )}
                                </>
                            )}
                        </>
                    )}

                    <View style={styles.modalButtons}>
                        <AppButton
                            title={t('hatimDetailScreen.delete')}
                            onPress={onDelete}
                            disabled={isUpdating}
                            variant="outline"
                            style={[common.button, { borderColor: theme.error, backgroundColor: theme.error + '15' }]}
                            textStyle={{ color: theme.error }}
                        />

                        <View style={common.row}>
                            <AppButton
                                title={t('hatimDetailScreen.cancel')}
                                onPress={onClose}
                                variant="secondary"
                                style={[common.button, { marginRight: SPACING.md, backgroundColor: theme.border }]}
                                textStyle={{ color: theme.text }}
                            />
                            <AppButton
                                title={t('hatimDetailScreen.update')}
                                onPress={onUpdate}
                                loading={isUpdating}
                                disabled={isUpdating}
                                variant="primary"
                                style={common.button}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        inputLabel: {
            ...common.inputLabel,
            color: theme.textSecondary,
        },
        inputLabelNoMarginTop: {
            marginTop: 0,
        },
        editInputStyle: {
            ...common.input,
            minHeight: 50,
            justifyContent: 'center',
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: SPACING.lg,
        },
    });
};
