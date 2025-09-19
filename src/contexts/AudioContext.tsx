import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Verse as VerseType, AudioState } from '../types';

interface AudioContextType {
    audioState: AudioState;
    playVerse: (verse: VerseType) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
    togglePlayPause: () => Promise<void>;
    changePlaybackRate: (rate: number) => Promise<void>;
    setVersesForAutoplay: (verses: VerseType[]) => void;
    startMemorization: (surahNumber: number, startVerseNumber: number, endVerseNumber: number, repetitionCount: number, mode?: 'range' | 'individual') => Promise<void>;
    cancelMemorization: () => void;
    playPreviewWithReciter: (verse: VerseType, reciterId: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

interface AudioProviderProps {
    children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
    const audioPlayer = useAudioPlayer();

    return (
        <AudioContext.Provider value={audioPlayer}>
            {children}
        </AudioContext.Provider>
    );
};

export const useGlobalAudio = (): AudioContextType => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useGlobalAudio must be used within an AudioProvider');
    }
    return context;
};
