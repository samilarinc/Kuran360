import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles, CommonStyles } from '@/contexts/ThemeContext';
import { AppButton } from '@/components/AppButton';
import { ArabicText } from '@/components/ArabicText';
import { formatRoot } from '@/utils/arabicText';
import { WordTranslation } from '@/types';
import { SPACING, FONT_SIZES, Theme } from '@/theme';

interface WordRootModalProps {
    word: WordTranslation | null;
    onClose: () => void;
    onSearchRoot: (root: string) => void;
}

/** A word-by-word chip opened up: the word, its meaning and its root, with a shortcut to every verse using that root. */
export const WordRootModal: React.FC<WordRootModalProps> = ({ word, onClose, onSearchRoot }) => {
    const { common } = useTheme();
    const { t } = useTranslation();
    const styles = useThemedStyles(createStyles);

    return (
        <Modal transparent visible={!!word} animationType="fade" onRequestClose={onClose}>
            <View style={common.modalOverlay}>
                <View style={styles.modalContent}>
                    {word && (
                        <>
                            <ArabicText style={styles.word}>{word.arabic}</ArabicText>
                            <Text style={styles.translation}>{word.translation}</Text>

                            {!!word.root && (
                                <View style={styles.rootBox}>
                                    <Text style={common.smallText}>{t('wordRootModal.root')}</Text>
                                    <ArabicText style={styles.root}>{formatRoot(word.root)}</ArabicText>
                                </View>
                            )}

                            <View style={styles.fullWidth}>
                                {!!word.root && (
                                    <AppButton
                                        title={t('wordRootModal.searchRoot')}
                                        onPress={() => {
                                            onClose();
                                            onSearchRoot(word.root!);
                                        }}
                                        variant="primary"
                                        style={styles.fullWidth}
                                    />
                                )}
                                <AppButton
                                    title={t('wordRootModal.close')}
                                    onPress={onClose}
                                    variant="outline"
                                    style={[styles.fullWidth, common.mtMd]}
                                />
                            </View>
                        </>
                    )}
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
        word: {
            fontSize: FONT_SIZES.arabic,
            color: theme.text,
            fontWeight: '600',
            textAlign: 'center',
        },
        translation: {
            ...common.subtitle,
            textAlign: 'center',
            marginTop: SPACING.xs,
        },
        rootBox: {
            alignItems: 'center',
            marginVertical: SPACING.lg,
        },
        root: {
            fontSize: FONT_SIZES.arabic,
            color: theme.primary,
            fontWeight: '600',
            writingDirection: 'rtl',
        },
        fullWidth: {
            width: '100%',
        },
    });
};
