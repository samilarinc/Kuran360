import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { HeaderWithDarkModeToggle } from '../components/HeaderWithDarkModeToggle';
import { useThreads, useCreateThread } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { VerseMention } from '../types';
import { FONT_SIZES, SPACING } from '../constants';

export const ForumScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { data: threads = [] } = useThreads();
  const createThread = useCreateThread();
  const { user } = useAuth();
  const { theme } = useTheme();
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

  const styles = createStyles(theme);
  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithDarkModeToggle
        title="Forum"
        showHomeButton={true}
        onHomePress={() => navigation.navigate('Main')}
      />
      {user ? (
        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Question title" />
          <Text style={styles.label}>Body</Text>
          <TextInput style={[styles.input, styles.multiline]} value={body} onChangeText={setBody} placeholder="Ask your question..." multiline />
          {/* Minimal mentions input: allow single mention for now via simple pattern S:V */}
          <Text style={styles.label}>Mention (S:V)</Text>
          <TextInput style={styles.input} placeholder="e.g. 2:255" onSubmitEditing={(e) => {
            const v = e.nativeEvent.text.trim();
            const match = v.match(/^(\d+):(\d+)$/);
            if (match) {
              setMentions([{ surahNumber: parseInt(match[1], 10), verseNumber: parseInt(match[2], 10) }]);
            }
          }} />
          <TouchableOpacity style={styles.button} onPress={onCreate}>
            <Text style={styles.buttonText}>Create Thread</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.note}>Girmek için oturum açın.</Text>
      )}

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.thread} onPress={() => navigation.navigate('ForumThread', { threadId: item.id })}>
            <Text style={styles.threadTitle}>{item.title}</Text>
            <Text style={styles.threadMeta}>{item.replyCount} replies</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.note}>No threads yet.</Text>}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: SPACING.md },
  header: { fontSize: FONT_SIZES.large, fontWeight: '700', color: theme.text, marginBottom: SPACING.md },
  card: { backgroundColor: theme.cardBackground, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md, borderColor: theme.border, borderWidth: 1 },
  label: { color: theme.textSecondary, marginBottom: 4 },
  input: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 8, padding: 10, color: theme.text, marginBottom: SPACING.sm },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  thread: { padding: SPACING.md, borderRadius: 12, backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border, marginBottom: SPACING.sm },
  threadTitle: { fontSize: FONT_SIZES.medium, fontWeight: '600', color: theme.text },
  threadMeta: { fontSize: FONT_SIZES.small, color: theme.textSecondary, marginTop: 4 },
  note: { color: theme.textSecondary, textAlign: 'center', marginVertical: SPACING.md },
});
