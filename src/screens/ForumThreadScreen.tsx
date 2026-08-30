import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { AppButton } from '@/components/AppButton';
import { usePosts, useCreatePost } from '@/contexts/ForumContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { createCommonStyles } from '@/theme/common.styles';

export const ForumThreadScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const threadId: string | undefined = route.params?.threadId;
  const { data: posts = [] } = usePosts(threadId);
  const createPost = useCreatePost();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [body, setBody] = useState('');

  const onReply = async () => {
    if (!user || !threadId) return;
    const id = await createPost.mutateAsync({ threadId, body, mentions: [] });
    if (id) {
      setBody('');
    }
  };

  const styles = useMemo(() => createCommonStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t('screenTitles.forumThread')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showHomeButton={true}
        onHomePress={() => navigation.navigate('Main')}
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.sectionCardCompact}>
            <Text style={styles.text}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.note}>{t('forumThreadScreen.noReplies')}</Text>}
      />

      {user ? (
        <View style={styles.sectionCardCompact}>
          <TextInput style={[styles.compactInput, styles.textArea]} value={body} onChangeText={setBody} placeholder={t('forumThreadScreen.replyPlaceholder')} multiline />
          <AppButton title={t('forumThreadScreen.send')} onPress={onReply} variant="primary" />
        </View>
      ) : (
        <Text style={styles.note}>{t('forumThreadScreen.signInToReply')}</Text>
      )}
    </SafeAreaView>
  );
};
