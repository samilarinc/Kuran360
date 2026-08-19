import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { usePosts, useCreatePost } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './ForumThreadScreen.styles';

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

  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithDarkModeToggle
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
          <View style={styles.post}>
            <Text style={styles.postBody}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.note}>{t('forumThreadScreen.noReplies')}</Text>}
      />

      {user ? (
        <View style={styles.replyBox}>
          <TextInput style={[styles.input, styles.multiline]} value={body} onChangeText={setBody} placeholder={t('forumThreadScreen.replyPlaceholder')} multiline />
          <TouchableOpacity style={styles.button} onPress={onReply}>
            <Text style={styles.buttonText}>{t('forumThreadScreen.send')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.note}>{t('forumThreadScreen.signInToReply')}</Text>
      )}
    </SafeAreaView>
  );
};
