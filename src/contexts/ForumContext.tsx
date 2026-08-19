import React, { createContext, useContext, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { Post, Thread, VerseMention } from '../types';

type CreateThreadInput = { title: string; body: string; mentions: VerseMention[] };
type CreatePostInput = { threadId: string; body: string; mentions: VerseMention[] };

type ForumContextType = {
  minIntervalMs: number;
  tooSoon: () => boolean;
  markNow: () => void;
};

const ForumContext = createContext<ForumContextType | undefined>(undefined);

export const ForumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lastActionAtRef = useRef<number>(0);
  const [minIntervalMs] = useState(5000); // 5s simple client-side rate-limit

  const tooSoon = () => Date.now() - lastActionAtRef.current < minIntervalMs;
  const markNow = () => { lastActionAtRef.current = Date.now(); };

  const value: ForumContextType = { minIntervalMs, tooSoon, markNow };
  return <ForumContext.Provider value={value}>{children}</ForumContext.Provider>;
};

const useForumRateLimit = () => {
  const ctx = useContext(ForumContext);
  if (!ctx) throw new Error('useForum hooks must be used within ForumProvider');
  return ctx;
};

const fetchThreads = async (pageSize: number): Promise<Thread[]> => {
  const q = query(collection(db, 'threads'), orderBy('updatedAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  const out: Thread[] = [];
  snap.forEach(d => out.push({ id: d.id, ...(d.data() as any) } as Thread));
  return out;
};

const fetchPosts = async (threadId: string, pageSize: number): Promise<Post[]> => {
  const q = query(collection(db, 'posts'), where('threadId', '==', threadId), orderBy('createdAt', 'asc'), limit(pageSize));
  const snap = await getDocs(q);
  const out: Post[] = [];
  snap.forEach(d => out.push({ id: d.id, ...(d.data() as any) } as Post));
  return out;
};

export const useThreads = (pageSize: number = 20) => {
  return useQuery({
    queryKey: ['forum', 'threads', pageSize],
    queryFn: () => fetchThreads(pageSize),
    placeholderData: (prev) => prev ?? [],
  });
};

export const usePosts = (threadId: string | undefined, pageSize: number = 50) => {
  return useQuery({
    queryKey: ['forum', 'posts', threadId, pageSize],
    queryFn: () => fetchPosts(threadId as string, pageSize),
    enabled: !!threadId,
    placeholderData: (prev) => prev ?? [],
  });
};

export const useCreateThread = () => {
  const { user, userProfile } = useAuth();
  const { tooSoon, markNow } = useForumRateLimit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, body, mentions }: CreateThreadInput) => {
      if (!user?.uid) return null;
      if (tooSoon()) return null;
      const payload = {
        authorId: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'User',
        authorPhotoURL: user.photoURL || null,
        title: title.trim(),
        body: body.trim(),
        mentions: (mentions || []).map(m => ({ surahNumber: m.surahNumber, verseNumber: m.verseNumber })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        replyCount: 0,
      };
      const ref = await addDoc(collection(db, 'threads'), payload);
      markNow();
      return ref.id;
    },
    onSuccess: (id) => {
      if (id) queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
    },
  });
};

export const useCreatePost = () => {
  const { user, userProfile } = useAuth();
  const { tooSoon, markNow } = useForumRateLimit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, body, mentions }: CreatePostInput) => {
      if (!user?.uid) return null;
      if (tooSoon()) return null;
      const payload = {
        threadId,
        authorId: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'User',
        authorPhotoURL: user.photoURL || null,
        body: body.trim(),
        mentions: (mentions || []).map(m => ({ surahNumber: m.surahNumber, verseNumber: m.verseNumber })),
        createdAt: Date.now(),
      };
      const ref = await addDoc(collection(db, 'posts'), payload);
      const threadRef = doc(db, 'threads', threadId);
      await updateDoc(threadRef, { updatedAt: Date.now() });
      markNow();
      return ref.id;
    },
    onSuccess: (id, variables) => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['forum', 'posts', variables.threadId] });
        queryClient.invalidateQueries({ queryKey: ['forum', 'threads'] });
      }
    },
  });
};
