import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Verse as VerseType, AudioState } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export const useAudioPlayer = () => {
  const { settings } = useSettings();
  const settingsRef = useRef(settings);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentVerse: null,
    duration: 0,
    position: 0,
    isLoading: false,
  });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [allVerses, setAllVerses] = useState<VerseType[]>([]);

  // Keep settings ref updated
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  const setVersesForAutoplay = (verses: VerseType[]) => {
    setAllVerses(verses);
  };

  const playNextVerse = (currentVerse?: VerseType) => {
    // Use the passed verse or fall back to state
    const verseToUse = currentVerse || audioState.currentVerse;
    console.log(`Attempting to play next verse. Current verse ID: ${verseToUse?.id}`);

    // Use ref to get current settings value (avoid closure issues)
    if (!settingsRef.current.autoplayEnabled || !verseToUse || !allVerses.length) {
      console.log('Autoplay conditions not met:', {
        autoplayEnabled: settingsRef.current.autoplayEnabled,
        hasCurrentVerse: !!verseToUse,
        hasAllVerses: allVerses.length > 0
      });
      return;
    }

    const currentIndex = allVerses.findIndex(v => v.id === verseToUse.id);
    const nextIndex = currentIndex + 1;
    console.log(`Autoplay: Current index ${currentIndex}, moving to next index ${nextIndex}`);

    if (nextIndex < allVerses.length) {
      const nextVerse = allVerses[nextIndex];
      console.log(`Next verse found: ${nextVerse.id} (Surah ${nextVerse.surahNumber}, Verse ${nextVerse.number})`);
      playVerse(nextVerse);
    } else {
      console.log('Reached end of surah, stopping autoplay');
      stop();
    }
  };

  const playVerse = async (verse: VerseType) => {
    try {
      setAudioState(prev => ({ ...prev, isLoading: true }));

      // Stop any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Generate the audio filename - always use this format since audioFileName is not set in data
      const audioFileName = `${verse.surahNumber.toString().padStart(3, '0')}${verse.number.toString().padStart(3, '0')}.mp3`;

      // For React Native with Metro bundler, serve the audio files via HTTP
      // Use dynamic URL based on current environment
      const getBaseUrl = () => {
        if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
          // Web environment - use current domain
          const win = (globalThis as any).window;
          return `${win.location.protocol}//${win.location.host}`;
        }
        // Mobile environment - use localhost with Metro bundler
        return 'http://localhost:8081';
      };
      
      const audioUri = `${getBaseUrl()}/sudais_all_verse/${audioFileName}`;
      console.log(`Attempting to load audio from: ${audioUri}`);

      // Load and play the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);

      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setAudioState(prev => ({
            ...prev,
            isPlaying: status.isPlaying || false,
            duration: status.durationMillis || 0,
            position: status.positionMillis || 0,
            isLoading: false,
          }));

          // Check if the verse has finished playing for autoplay
          if (status.didJustFinish) {
            // Small delay before checking autoplay to ensure settings are updated
            setTimeout(() => {
              // Use ref to get the most current autoplay setting
              if (settingsRef.current.autoplayEnabled) {
                playNextVerse(verse);
              } else {
                console.log('Autoplay disabled, stopping after current verse');
                // Don't stop the sound, just don't play next verse
                setAudioState(prev => ({
                  ...prev,
                  isPlaying: false,
                  currentVerse: null,
                }));
              }
            }, 50);
          }
        }
      });

      setAudioState(prev => ({
        ...prev,
        currentVerse: verse,
        isPlaying: true,
        isLoading: false,
      }));

      console.log(`Successfully loaded and playing: ${audioFileName} for verse ${verse.id}`);

    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioState(prev => ({ ...prev, isLoading: false }));

      // Fall back to simulation if audio loading fails
      setAudioState(prev => ({
        ...prev,
        currentVerse: verse,
        isPlaying: true,
        isLoading: false,
      }));
    }
  };

  const pause = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
      }
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resume = async () => {
    try {
      if (sound) {
        await sound.playAsync();
      }
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const stop = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setAudioState({
        isPlaying: false,
        currentVerse: null,
        duration: 0,
        position: 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const togglePlayPause = async () => {
    if (audioState.isPlaying) {
      await pause();
    } else if (audioState.currentVerse) {
      await resume();
    }
  };

  return {
    audioState,
    playVerse,
    pause,
    resume,
    stop,
    togglePlayPause,
    setVersesForAutoplay,
  };
};
