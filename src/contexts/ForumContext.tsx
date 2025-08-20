import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { addDoc, collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { Post, Thread, VerseMention } from '../types';

type ForumContextType = {
  createThread: (title: string, body: string, mentions: VerseMention[]) => Promise<string | null>;
  createPost: (threadId: string, body: string, mentions: VerseMention[]) => Promise<string | null>;
  listThreads: (pageSize?: number) => Promise<Thread[]>;
  listPosts: (threadId: string, pageSize?: number) => Promise<Post[]>;
};

const ForumContext = createContext<ForumContextType | undefined>(undefined);

export const ForumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const lastActionAtRef = useRef<number>(0);
  const [minIntervalMs] = useState(5000); // 5s simple client-side rate-limit

  const tooSoon = () => Date.now() - lastActionAtRef.current < minIntervalMs;
  const markNow = () => { lastActionAtRef.current = Date.now(); };

  const createThread = async (title: string, body: string, mentions: VerseMention[]) => {
    if (!user?.uid) return null;
    if (tooSoon()) return null;
    try {
      const payload = {
        authorId: user.uid,
        authorName: user.displayName || 'User',
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
    } catch (e) {
      console.warn('createThread failed', e);
      return null;
    }
  };

  const createPost = async (threadId: string, body: string, mentions: VerseMention[]) => {
    if (!user?.uid) return null;
    if (tooSoon()) return null;
    try {
      const payload = {
        threadId,
        authorId: user.uid,
        authorName: user.displayName || 'User',
        authorPhotoURL: user.photoURL || null,
        body: body.trim(),
        mentions: (mentions || []).map(m => ({ surahNumber: m.surahNumber, verseNumber: m.verseNumber })),
        createdAt: Date.now(),
      };
  const ref = await addDoc(collection(db, 'posts'), payload);
  // update thread metadata
  const threadRef = doc(db, 'threads', threadId);
  await updateDoc(threadRef, { updatedAt: Date.now() });
      markNow();
      return ref.id;
    } catch (e) {
      console.warn('createPost failed', e);
      return null;
    }
  };

  const listThreads = async (pageSize: number = 20) => {
    try {
      const q = query(collection(db, 'threads'), orderBy('updatedAt', 'desc'), limit(pageSize));
      const snap = await getDocs(q);
      const out: Thread[] = [];
      snap.forEach(d => out.push({ id: d.id, ...(d.data() as any) } as Thread));
      return out;
    } catch (e) {
      console.warn('listThreads failed', e);
      return [];
    }
  };

  const listPosts = async (threadId: string, pageSize: number = 50) => {
    try {
      const q = query(collection(db, 'posts'), where('threadId', '==', threadId), orderBy('createdAt', 'asc'), limit(pageSize));
      const snap = await getDocs(q);
      const out: Post[] = [];
      snap.forEach(d => out.push({ id: d.id, ...(d.data() as any) } as Post));
      return out;
    } catch (e) {
      console.warn('listPosts failed', e);
      return [];
    }
  };

  const value = useMemo<ForumContextType>(() => ({ createThread, createPost, listThreads, listPosts }), []);
  return <ForumContext.Provider value={value}>{children}</ForumContext.Provider>;
};

export const useForum = () => {
  const ctx = useContext(ForumContext);
  if (!ctx) throw new Error('useForum must be used within ForumProvider');
  return ctx;
};
