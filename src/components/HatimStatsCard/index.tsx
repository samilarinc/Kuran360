import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Hatim } from '@/types';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { createCommonStyles } from '@/theme/common.styles';
import { createStyles } from './index.styles';

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
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const common = useMemo(() => createCommonStyles(theme), [theme]);

    return (
        <View style={styles.infoCard}>
            <Text style={styles.description}>
                {hatim.description || t('hatimDetailScreen.noDescription')}
            </Text>

            {formattedDeadline && (
                <View style={styles.deadlineInfo}>
                    <Text style={styles.deadlineText}>
                        {t('hatimDetailScreen.deadline', { date: formattedDeadline })}
                    </Text>
                    <Badge
                        label={t('hatimDetailScreen.timeRemaining', { time: timeLeft })}
                        variant="tint"
                        shape="pill"
                        style={styles.countdownBadge}
                        textStyle={{ fontWeight: '700' }}
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
                        style={styles.miniProgressBarBackground}
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
                        style={styles.miniProgressBarBackground}
                    />
                </View>
            </View>
        </View>
    );
};
