import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { useForum } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { Post } from '../types';
import { FONT_SIZES, SPACING } from '../constants';

export const ForumThreadScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { createPost, listPosts } = useForum();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [body, setBody] = useState('');

  useEffect(() => {
    (async () => {
      const data = await listPosts(route.params?.threadId);
      setPosts(data);
    })();
  }, [route.params?.threadId, listPosts]);

  const onReply = async () => {
    if (!user) return;
    const id = await createPost(route.params.threadId, body, []);
    if (id) {
      setBody('');
  const data = await listPosts(route.params?.threadId);
  setPosts(data);
    }
  };

  const styles = createStyles(theme);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Thread</Text>
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
