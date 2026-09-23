import React from 'react';
import { View, Text, Modal, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { Hatim, HatimPart } from '@/types';
import { AppButton } from '@/components/AppButton';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

interface PartActionModalProps {
    visible: boolean;
    hatim: Hatim;
    part: HatimPart | null;
    currentUserId?: string;
    currentUserDisplayName?: string | null;
    actionLoading: number | null;
    localPages: number;
    onClose: () => void;
    onUpdatePages: (pages: number) => void;
    onToggleCompletion: () => void;
    onClaim: () => void;
    onUnclaim: () => void;
}

export const PartActionModal: React.FC<PartActionModalProps> = ({
    visible,
    hatim,
    part,
    currentUserId,
    currentUserDisplayName,
    actionLoading,
    localPages,
    onClose,
    onUpdatePages,
    onToggleCompletion,
    onClaim,
    onUnclaim,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);

    if (!part) return null;

    const isOwnPart = part.claimedById === currentUserId;
    const isCreator = hatim.creatorId === currentUserId;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={common.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={common.modalTitle}>
                        {t('hatimDetailScreen.partActions', { number: part.partNumber })}
                    </Text>

                    {part.claimedById ? (
                        <View style={[common.center, common.mbXl]}>
                            <Text style={styles.claimText}>
                                {t('hatimDetailScreen.claimedBy')}
                                <Text style={styles.claimedByName}>
                                    {isOwnPart ? (currentUserDisplayName || t('hatimDetailScreen.me')) : part.claimedByName}
                                </Text>
                            </Text>
                            <Text style={[styles.claimStatus, part.isCompleted ? styles.claimStatusCompleted : styles.claimStatusReading]}>
                                {t('hatimDetailScreen.status', { status: part.isCompleted ? t('hatimDetailScreen.statusCompleted') : t('hatimDetailScreen.statusReading') })}
                            </Text>

                            {(isOwnPart || isCreator) && (
                                <View style={styles.progressContainer}>
                                    <Text style={[common.smallText, common.mbSm]}>
                                        {t('hatimDetailScreen.pagesRead', { read: localPages, total: part.totalPages || 20 })}
                                    </Text>
                                    <View style={[common.row, common.center]}>
                                        <AppButton
                                            title="-"
                                            onPress={() => onUpdatePages(localPages - 1)}
                                            variant="secondary"
                                            shape="circle"
                                            size="small"
                                            style={{ backgroundColor: theme.border }}
                                            textStyle={{ color: theme.text }}
                                        />

                                        <TextInput
                                            style={styles.progressInput}
                                            value={String(localPages)}
                                            keyboardType="number-pad"
                                            onChangeText={(val) => {
                                                const n = parseInt(val, 10);
                                                if (!isNaN(n)) onUpdatePages(n);
                                                else if (val === '') onUpdatePages(0);
                                            }}
                                        />

                                        <AppButton
                                            title="+"
                                            onPress={() => onUpdatePages(localPages + 1)}
                                            variant="secondary"
                                            shape="circle"
                                            size="small"
                                            style={{ backgroundColor: theme.border }}
                                            textStyle={{ color: theme.text }}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.modalDescription}>
                            {t('hatimDetailScreen.notClaimedYet')}
                        </Text>
                    )}

                    <View style={styles.fullWidth}>
                        {part.claimedById && (isOwnPart || isCreator) ? (
                            <>
                                <AppButton
                                    title={part.isCompleted ? t('hatimDetailScreen.markIncomplete') : t('hatimDetailScreen.markComplete')}
                                    onPress={onToggleCompletion}
                                    variant={part.isCompleted ? 'secondary' : 'primary'}
                                    style={[styles.fullWidth, part.isCompleted && { backgroundColor: theme.accent }]}
                                    loading={actionLoading === part.partNumber}
                                    disabled={actionLoading !== null}
                                />

                                <AppButton
                                    title={isOwnPart ? t('hatimDetailScreen.releasePart') : t('hatimDetailScreen.unclaimPart')}
                                    onPress={onUnclaim}
                                    variant="danger"
                                    style={[styles.fullWidth, common.mtMd]}
                                    disabled={actionLoading !== null}
                                />
                            </>
                        ) : !part.claimedById ? (
                            <AppButton
                                title={t('hatimDetailScreen.claimPart')}
                                onPress={onClaim}
                                variant="primary"
                                style={styles.fullWidth}
                                loading={actionLoading === part.partNumber}
                                disabled={actionLoading !== null}
                            />
                        ) : null}

                        <AppButton
                            title={t('hatimDetailScreen.close')}
                            onPress={onClose}
                            variant="outline"
                            style={[styles.fullWidth, common.mtMd]}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        modalContent: {
            ...common.modalContent,
            maxWidth: 400,
        },
        modalDescription: {
            ...common.subtitle,
            textAlign: 'center',
            marginBottom: SPACING.xl,
        },
        claimText: {
            ...common.subtitle,
            marginBottom: SPACING.xs,
        },
        claimedByName: {
            color: theme.text,
            fontWeight: '700',
        },
        claimStatus: {
            fontSize: FONT_SIZES.small,
            fontWeight: '700',
            textTransform: 'uppercase',
        },
        claimStatusCompleted: {
            color: theme.success,
        },
        claimStatusReading: {
            color: theme.warning,
        },
        fullWidth: {
            width: '100%',
        },
        progressContainer: {
            marginTop: SPACING.lg,
            alignItems: 'center',
            width: '100%',
        },
        progressInput: {
            width: 60,
            height: 40,
            borderWidth: 1,
            borderRadius: 8,
            marginHorizontal: SPACING.md,
            textAlign: 'center',
            fontSize: FONT_SIZES.medium,
            fontWeight: '700',
            color: theme.text,
            borderColor: theme.border,
        },
    });
};
