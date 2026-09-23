import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { Hatim } from '@/types';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

interface HatimStatsCardProps {
    hatim: Hatim;
    completedCount: number;
    claimedCount: number;
    timeLeft: string;
    formattedDeadline: string | null;
}

export const HatimStatsCard: React.FC<HatimStatsCardProps> = ({
    hatim,
    completedCount,
    claimedCount,
    timeLeft,
    formattedDeadline,
}) => {
    const { theme, common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);

    return (
        <View style={styles.infoCard}>
            <Text style={styles.description}>
                {hatim.description || t('hatimDetailScreen.noDescription')}
            </Text>

            {formattedDeadline && (
                <View style={[common.center, common.mbMd]}>
                    <Text style={styles.deadlineText}>
                        {t('hatimDetailScreen.deadline', { date: formattedDeadline })}
                    </Text>
                    <Badge
                        label={t('hatimDetailScreen.timeRemaining', { time: timeLeft })}
                        variant="tint"
                        shape="pill"
                        style={styles.countdownBadge}
                        textStyle={common.textStrong}
                    />
                </View>
            )}

            <View style={styles.statsRow}>
                <View style={styles.statColumn}>
                    <Text style={[styles.statValue, styles.statValueCompleted]}>{completedCount} / 30</Text>
                    <Text style={common.smallText}>{t('hatimDetailScreen.completedStat')}</Text>
                    <ProgressBar
                        progress={(completedCount / 30) * 100}
                        height={6}
                        fillColor="#4CAF50"
                        style={common.mtSm}
                    />
                </View>
                <View style={styles.statColumn}>
                    <Text style={[styles.statValue, styles.statValueClaimed]}>
                        {claimedCount} / 30
                    </Text>
                    <Text style={common.smallText}>{t('hatimDetailScreen.claimedStat')}</Text>
                    <ProgressBar
                        progress={(claimedCount / 30) * 100}
                        height={6}
                        fillColor={theme.primary}
                        style={common.mtSm}
                    />
                </View>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {

    return StyleSheet.create({
        infoCard: {
            ...common.infoCard,
            marginBottom: SPACING.xl,
        },
        description: {
            ...common.subtitle,
            lineHeight: 22,
            marginBottom: SPACING.lg,
        },
        deadlineText: {
            fontSize: 14,
            fontWeight: '700',
            marginTop: SPACING.xs,
            textAlign: 'center',
            marginBottom: SPACING.md,
            color: theme.primary,
        },
        countdownBadge: {
            paddingHorizontal: 12,
            marginTop: 4,
            alignSelf: 'center',
        },
        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            borderTopWidth: 1,
            borderTopColor: theme.border,
            paddingTop: SPACING.lg,
        },
        statColumn: {
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: SPACING.md,
        },
        statValue: {
            fontSize: FONT_SIZES.large,
            fontWeight: '700',
        },
        statValueCompleted: {
            color: theme.success,
        },
        statValueClaimed: {
            color: theme.primary,
        },
    });
};
