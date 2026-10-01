import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CircleCheck, CircleAlert, CircleDashed, Lightbulb, RotateCcw, ListRestart, BookOpen } from 'lucide-react-native';
import { AppButton } from '@/components/AppButton';
import { RecitedVerse } from '@/components/RecitedVerse';
import { useTheme, useThemedStyles, Theme, CommonStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, RADIUS, SPACING } from '@/theme';
import { isFlawless, RecitationResult } from '@/utils/recitationCheck';

/** The last check of a verse in a memorization session. */
export interface MemorizationAttempt {
    result: RecitationResult;
    transcript: string;
    /** Words shown with the hint button before reciting. */
    hints: number;
}

interface MemorizationSummaryProps {
    title: string;
    verses: number[];
    attempts: Record<number, MemorizationAttempt>;
    onOpenVerse: (verse: number) => void;
    onRetryMistakes: () => void;
    onRestart: () => void;
    onNewSelection: () => void;
}

/** End of a sequential session: overall score, then every verse with how it went; a verse opens for another try. */
export const MemorizationSummary: React.FC<MemorizationSummaryProps> = ({
    title,
    verses,
    attempts,
    onOpenVerse,
    onRetryMistakes,
    onRestart,
    onNewSelection,
}) => {
    const { t } = useTranslation();
    const { theme, common } = useTheme();
    const styles = useThemedStyles(createStyles);

    const read = verses.filter(verse => attempts[verse]);
    const flawless = read.filter(verse => isFlawless(attempts[verse].result));
    const withMistakes = read.length - flawless.length;
    const unread = verses.length - read.length;
    const accuracy = read.length ? read.reduce((sum, verse) => sum + attempts[verse].result.accuracy, 0) / read.length : 0;
    const totalHints = read.reduce((sum, verse) => sum + attempts[verse].hints, 0);
    const countWords = (status: 'wrong' | 'missed') =>
        read.reduce((sum, verse) => sum + attempts[verse].result.words.filter(w => w.status === status).length, 0);

    const stats = [
        { label: t('memorization.summaryView.flawless'), value: flawless.length, color: theme.success },
        { label: t('memorization.summaryView.withMistakes'), value: withMistakes, color: theme.error },
        { label: t('memorization.summaryView.unread'), value: unread, color: theme.textSecondary },
    ];

    return (
        <>
            <View style={[common.sectionCard, styles.scoreCard]}>
                <Text style={common.sectionLabel}>{title}</Text>
                <Text style={styles.score}>%{Math.round(accuracy * 100)}</Text>
                <Text style={common.subtitle}>{t('memorization.summaryView.averageAccuracy')}</Text>
                <View style={styles.statsRow}>
                    {stats.map(stat => (
                        <View key={stat.label} style={styles.stat}>
                            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                            <Text style={[common.smallText, common.textCenter]}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
                {read.length > 0 && (
                    <Text style={[common.smallText, common.textCenter]}>
                        {t('memorization.summary', { wrong: countWords('wrong'), missed: countWords('missed') })}
                    </Text>
                )}
                {totalHints > 0 && (
                    <Text style={[common.smallText, common.textCenter]}>{t('memorization.summaryView.totalHints', { count: totalHints })}</Text>
                )}
            </View>

            <View style={styles.buttonRow}>
                {withMistakes + unread > 0 && (
                    <AppButton
                        title={t('memorization.summaryView.retryMistakes')}
                        icon={<RotateCcw size={16} color="#FFFFFF" />}
                        size="small"
                        onPress={onRetryMistakes}
                    />
                )}
                <AppButton
                    title={t('memorization.summaryView.restart')}
                    icon={<ListRestart size={16} color={theme.primary} />}
                    variant="outline"
                    size="small"
                    onPress={onRestart}
                />
                <AppButton
                    title={t('memorization.summaryView.newSelection')}
                    icon={<BookOpen size={16} color={theme.primary} />}
                    variant="outline"
                    size="small"
                    onPress={onNewSelection}
                />
            </View>

            {verses.map(verse => {
                const attempt = attempts[verse];
                const ok = attempt && isFlawless(attempt.result);
                const Icon = !attempt ? CircleDashed : ok ? CircleCheck : CircleAlert;
                const color = !attempt ? theme.textSecondary : ok ? theme.success : theme.error;
                return (
                    <TouchableOpacity key={verse} style={[common.sectionCard, styles.verseCard]} onPress={() => onOpenVerse(verse)} activeOpacity={0.7}>
                        <View style={common.rowBetween}>
                            <View style={[common.row, common.gapSm]}>
                                <Icon size={18} color={color} />
                                <Text style={common.textStrong}>{t('memorization.summaryView.verse', { verse })}</Text>
                            </View>
                            <View style={[common.row, common.gapSm]}>
                                {attempt && attempt.hints > 0 && (
                                    <View style={styles.hintBadge}>
                                        <Lightbulb size={12} color={theme.warning} />
                                        <Text style={styles.hintBadgeText}>{t('memorization.summaryView.hints', { count: attempt.hints })}</Text>
                                    </View>
                                )}
                                <Text style={[styles.percent, { color }]}>
                                    {attempt ? `%${Math.round(attempt.result.accuracy * 100)}` : t('memorization.summaryView.notRead')}
                                </Text>
                            </View>
                        </View>
                        {attempt && !ok && <RecitedVerse result={attempt.result} style={styles.verseText} />}
                    </TouchableOpacity>
                );
            })}
        </>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
        scoreCard: {
            alignItems: 'center',
            gap: SPACING.xs,
        },
        score: {
            fontSize: FONT_SIZES.xxlarge * 1.5,
            fontWeight: 'bold',
            color: theme.primary,
        },
        statsRow: {
            flexDirection: 'row',
            alignSelf: 'stretch',
            marginVertical: SPACING.sm,
        },
        stat: {
            flex: 1,
            alignItems: 'center',
        },
        statValue: {
            fontSize: FONT_SIZES.xlarge,
            fontWeight: 'bold',
        },
        buttonRow: {
            ...common.rowWrap,
            justifyContent: 'center',
            gap: SPACING.sm,
        },
        verseCard: {
            gap: SPACING.sm,
            borderRadius: RADIUS.md,
        },
        hintBadge: {
            ...common.row,
            gap: 2,
            paddingHorizontal: SPACING.xs + 2,
            paddingVertical: 2,
            borderRadius: RADIUS.pill,
            backgroundColor: theme.warning + '20',
        },
        hintBadgeText: {
            fontSize: FONT_SIZES.small - 1,
            fontWeight: '600',
            color: theme.warning,
        },
        percent: {
            fontSize: FONT_SIZES.small,
            fontWeight: '600',
        },
        verseText: {
            fontSize: FONT_SIZES.medium + 2,
            lineHeight: (FONT_SIZES.medium + 2) * 1.8,
        },
    });
};
