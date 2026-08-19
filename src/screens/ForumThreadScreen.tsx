import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { usePosts, useCreatePost } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '../constants';

export const ForumThreadScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const threadId: string | undefined = route.params?.threadId;
  const { data: posts = [] } = usePosts(threadId);
  const createPost = useCreatePost();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [body, setBody] = useState('');

  const onReply = async () => {
    if (!user || !threadId) return;
    const id = await createPost.mutateAsync({ threadId, body, mentions: [] });
    if (id) {
      setBody('');
    }
  };

  const styles = createStyles(theme);
  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithDarkModeToggle
        title="Forum Konusu"
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
        ListEmptyComponent={<Text style={styles.note}>No replies yet.</Text>}
      />

      {user ? (
        <View style={styles.replyBox}>
          <TextInput style={[styles.input, styles.multiline]} value={body} onChangeText={setBody} placeholder="Reply..." multiline />
          <TouchableOpacity style={styles.button} onPress={onReply}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.note}>Girmek için oturum açın.</Text>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: SPACING.md },
  header: { fontSize: FONT_SIZES.large, fontWeight: '700', color: theme.text, marginBottom: SPACING.md },
  post: { padding: SPACING.md, borderRadius: 12, backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border, marginBottom: SPACING.sm },
  postBody: { fontSize: FONT_SIZES.medium, color: theme.text },
  note: { color: theme.textSecondary, textAlign: 'center', marginVertical: SPACING.md },
  replyBox: { backgroundColor: theme.cardBackground, borderRadius: 12, padding: SPACING.md, borderColor: theme.border, borderWidth: 1 },
  input: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 8, padding: 10, color: theme.text, marginBottom: SPACING.sm },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
