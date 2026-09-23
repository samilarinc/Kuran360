import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { useThreads, useCreateThread } from '@/contexts/ForumContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { VerseMention } from '@/types';

export const ForumScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { data: threads = [] } = useThreads();
  const createThread = useCreateThread();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mentions, setMentions] = useState<VerseMention[]>([]);

  const onCreate = async () => {
    if (!user) return;
    if (!title.trim() || !body.trim()) return;
    const id = await createThread.mutateAsync({ title, body, mentions });
    if (id) {
      setTitle('');
      setBody('');
      setMentions([]);
    }
  };

  const styles = useTheme().common;
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t('screenTitles.forum')}
        showHomeButton={true}
        onHomePress={() => navigation.navigate('Main')}
      />
      {user ? (
        <View style={styles.sectionCardCompact}>
          <Text style={{ color: theme.textSecondary }}>{t('forumScreen.titleLabel')}</Text>
          <TextInput style={styles.compactInput} value={title} onChangeText={setTitle} placeholder={t('forumScreen.titlePlaceholder')} />
          <Text style={{ color: theme.textSecondary }}>{t('forumScreen.bodyLabel')}</Text>
          <TextInput style={[styles.compactInput, styles.textArea]} value={body} onChangeText={setBody} placeholder={t('forumScreen.bodyPlaceholder')} multiline />
          {/* Minimal mentions input: allow single mention for now via simple pattern S:V */}
          <Text style={{ color: theme.textSecondary }}>{t('forumScreen.mentionLabel')}</Text>
          <TextInput style={styles.compactInput} placeholder={t('forumScreen.mentionPlaceholder')} onSubmitEditing={(e) => {
            const v = e.nativeEvent.text.trim();
            const match = v.match(/^(\d+):(\d+)$/);
            if (match) {
              setMentions([{ surahNumber: parseInt(match[1], 10), verseNumber: parseInt(match[2], 10) }]);
            }
          }} />
          <AppButton title={t('forumScreen.createThread')} onPress={onCreate} variant="primary" />
        </View>
      ) : (
        <Text style={styles.note}>{t('forumScreen.signInToPost')}</Text>
      )}

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.sectionCardCompact} onPress={() => navigation.navigate('ForumThread', { threadId: item.id })}>
            <Text style={styles.textStrong}>{item.title}</Text>
            <Text style={styles.smallText}>{t('forumScreen.replies', { count: item.replyCount })}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.note}>{t('forumScreen.noThreads')}</Text>}
      />
    </SafeAreaView>
  );
};
