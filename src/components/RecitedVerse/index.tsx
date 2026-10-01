import React from 'react';
import { Text, StyleProp, StyleSheet, TextStyle } from 'react-native';
import { ArabicText } from '@/components/ArabicText';
import { useThemedStyles } from '@/contexts/ThemeContext';
import { FONT_SIZES, Theme } from '@/theme';
import type { CommonStyles } from '@/contexts/ThemeContext';
import type { RecitationResult } from '@/utils/recitationCheck';

/** Highlight of a misread letter; also the swatch of its legend entry. */
export const LETTER_WRONG_COLOR = '#FFE100';

interface RecitedVerseProps {
    result: RecitationResult;
    style?: StyleProp<TextStyle>;
}

/** A checked verse: each word colored by how it was read, misread letters of wrong words highlighted. */
export const RecitedVerse: React.FC<RecitedVerseProps> = ({ result, style }) => {
    const styles = useThemedStyles(createStyles);
    const wordStyles = { ok: styles.wordOk, wrong: styles.wordWrong, missed: styles.wordMissed };

    return (
        <ArabicText style={[styles.verse, style]}>
            {result.words.map((word, i) => (
                <Text key={i} style={wordStyles[word.status]}>
                    {word.parts
                        ? word.parts.map((part, j) => (
                            <Text key={j} style={part.error ? styles.letterWrong : undefined}>{part.text}</Text>
                        ))
                        : word.text}
                    {' '}
                </Text>
            ))}
        </ArabicText>
    );
};

const createStyles = (theme: Theme, common: CommonStyles) => {
    return StyleSheet.create({
        verse: {
            ...common.arabicText,
            fontSize: FONT_SIZES.large,
            lineHeight: FONT_SIZES.large * 1.8,
        },
        // Word states of a checked recitation: read right, read wrong, skipped
        wordOk: {
            backgroundColor: theme.success + '30',
            color: theme.text,
        },
        wordWrong: {
            backgroundColor: theme.error + '30',
            color: theme.error,
        },
        wordMissed: {
            backgroundColor: theme.error + '14',
            color: theme.error,
            textDecorationLine: 'underline',
        },
        // A misread letter inside a wrong word
        letterWrong: {
            backgroundColor: LETTER_WRONG_COLOR,
            color: '#000000',
        },
    });
};
