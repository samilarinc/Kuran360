import React, { useMemo } from 'react';
import { View, Text, Modal, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/theme';
import { Hatim, HatimPart } from '@/types';
import { AppButton } from '@/components/AppButton';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

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
                        <View style={styles.claimInfo}>
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
                                    <Text style={styles.progressLabel}>
                                        {t('hatimDetailScreen.pagesRead', { read: localPages, total: part.totalPages || 20 })}
                                    </Text>
                                    <View style={styles.progressRow}>
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

                    <View style={styles.modalButtonsColumn}>
                        {part.claimedById && (isOwnPart || isCreator) ? (
                            <>
                                <AppButton
                                    title={part.isCompleted ? t('hatimDetailScreen.markIncomplete') : t('hatimDetailScreen.markComplete')}
                                    onPress={onToggleCompletion}
                                    variant={part.isCompleted ? 'secondary' : 'primary'}
                                    style={[{ width: '100%' }, part.isCompleted ? { backgroundColor: theme.accent } : undefined]}
                                    loading={actionLoading === part.partNumber}
                                    disabled={actionLoading !== null}
                                />

                                <AppButton
                                    title={isOwnPart ? t('hatimDetailScreen.releasePart') : t('hatimDetailScreen.unclaimPart')}
                                    onPress={onUnclaim}
                                    variant="danger"
                                    style={{ width: '100%', marginTop: SPACING.md }}
                                    disabled={actionLoading !== null}
                                />
                            </>
                        ) : !part.claimedById ? (
                            <AppButton
                                title={t('hatimDetailScreen.claimPart')}
                                onPress={onClaim}
                                variant="primary"
                                style={{ width: '100%' }}
                                loading={actionLoading === part.partNumber}
                                disabled={actionLoading !== null}
                            />
                        ) : null}

                        <AppButton
                            title={t('hatimDetailScreen.close')}
                            onPress={onClose}
                            variant="outline"
                            style={{ width: '100%', marginTop: SPACING.md }}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};
