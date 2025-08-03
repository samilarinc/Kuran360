import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Verse as VerseType, AudioState } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export const useAudioPlayer = () => {
  const { settings } = useSettings();
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentVerse: null,
    duration: 0,
    position: 0,
    isLoading: false,
  });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [allVerses, setAllVerses] = useState<VerseType[]>([]);

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

  const playNextVerse = () => {
    if (!settings.autoplayEnabled || !audioState.currentVerse || !allVerses.length) {
      return;
    }

    const currentIndex = allVerses.findIndex(v => v.id === audioState.currentVerse!.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < allVerses.length) {
      const nextVerse = allVerses[nextIndex];
      console.log(`Autoplay: Moving to next verse ${nextVerse.number}`);
      playVerse(nextVerse);
    } else {
      console.log('Autoplay: Reached end of surah');
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

      console.log(`Playing verse: ${verse.audioFileName}`);

      // Generate the audio filename if not provided
      const audioFileName = verse.audioFileName || `${verse.surahNumber.toString().padStart(3, '0')}${verse.number.toString().padStart(3, '0')}.mp3`;

      // For React Native with Metro bundler, serve the audio files via HTTP
      // Metro can serve static files from the project directory
      const audioUri = `http://localhost:8081/sudais_all_verse/${audioFileName}`;
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
          if (status.didJustFinish && settings.autoplayEnabled) {
            console.log('Verse finished, attempting autoplay...');
            setTimeout(() => playNextVerse(), 1000); // Small delay before next verse
          }
        }
      });

      setAudioState(prev => ({
        ...prev,
        currentVerse: verse,
        isPlaying: true,
        isLoading: false,
      }));

      console.log(`Successfully loaded and playing: ${verse.audioFileName}`);

    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioState(prev => ({ ...prev, isLoading: false }));

      // Fall back to simulation if audio loading fails
      console.log(`Simulating playback for: ${verse.audioFileName}`);
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
