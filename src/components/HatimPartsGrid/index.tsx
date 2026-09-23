import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, CommonStyles, useThemedStyles } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES, Theme } from '@/theme';
import { HatimPart } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';

interface HatimPartsGridProps {
    parts: HatimPart[];
    availableWidth: number;
    numColumns: number;
    partItemWidth: number;
    numberFontSize: number;
    claimantFontSize: number;
    currentUserId?: string;
    currentUserDisplayName?: string | null;
    actionLoading: number | null;
    onPartPress: (part: HatimPart) => void;
}

export const HatimPartsGrid: React.FC<HatimPartsGridProps> = ({
    parts,
    availableWidth,
    partItemWidth,
    numberFontSize,
    claimantFontSize,
    currentUserId,
    currentUserDisplayName,
    actionLoading,
    onPartPress,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);

    return (
        <View style={[styles.gridContainer, { width: availableWidth + SPACING.md }]}>
            <View style={styles.grid}>
                {parts.map((part) => (
                    <TouchableOpacity
                        key={part.partNumber}
                        style={[
                            styles.partItem,
                            {
                                backgroundColor: part.isCompleted
                                    ? '#2E7D32'
                                    : part.claimedById
                                        ? (part.claimedById === currentUserId ? '#1976D2' : '#78909C')
                                        : theme.cardBackground,
                                width: partItemWidth,
                            }
                        ]}
                        onPress={() => onPartPress(part)}
                        disabled={actionLoading === part.partNumber}
                    >
                        {actionLoading === part.partNumber ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Text style={[styles.partNumber, { color: part.claimedById ? '#fff' : theme.text, fontSize: numberFontSize }]}>
                                    {part.partNumber}
                                </Text>
                                <Text style={[styles.partClaimant, { color: part.claimedById ? 'rgba(255,255,255,0.8)' : theme.textSecondary, fontSize: claimantFontSize }]} numberOfLines={1}>
                                    {part.claimedById === currentUserId ? (currentUserDisplayName || t('hatimDetailScreen.me')) : (part.claimedByName || t('hatimDetailScreen.available'))}
                                </Text>
                                {part.claimedById && !part.isCompleted && (
                                    <ProgressBar
                                        progress={((part.pagesRead || 0) / (part.totalPages || 20)) * 100}
                                        height={4}
                                        trackColor="rgba(255,255,255,0.2)"
                                        fillColor="#4CAF50"
                                        style={styles.progressBarBackground}
                                    />
                                )}
                            </>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        gridContainer: {
            width: '100%',
            alignSelf: 'center',
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
        },
        partItem: {
            ...common.card,
            aspectRatio: 1,
            borderRadius: 12,
            borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.xs,
            shadowRadius: 2,
            borderColor: theme.border,
            marginRight: SPACING.md / 2,
            marginLeft: SPACING.md / 2,
        },
        partNumber: {
            fontSize: FONT_SIZES.xlarge,
            fontWeight: '700',
        },
        partClaimant: {
            fontSize: 10,
            marginTop: 4,
        },
        progressBarBackground: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
        },
    });
};
