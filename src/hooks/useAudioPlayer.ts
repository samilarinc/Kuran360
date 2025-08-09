import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Verse as VerseType, AudioState } from '../types';
import { loadSurah } from '../data/quranData';
import { useSettings } from '../contexts/SettingsContext';
import logger from '../utils/logger';

export const useAudioPlayer = () => {
  const { settings, availableReciters } = useSettings();
  const settingsRef = useRef(settings);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentVerse: null,
    duration: 0,
    position: 0,
    isLoading: false,
  });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [allVerses, setAllVerses] = useState<VerseType[]>([]);
  // Keep a ref in sync with allVerses to avoid stale closures inside audio callbacks
  const allVersesRef = useRef<VerseType[]>([]);
  // Protect cross-surah transitions from being overwritten by UI updates
  const pendingSurahRef = useRef<number | null>(null);

  // Memorization mode state (range within a single surah, repeating the whole range N times)
  const memActiveRef = useRef(false);
  const memSurahRef = useRef<number | null>(null);
  const memStartRef = useRef<number>(1);
  const memEndRef = useRef<number>(1);
  const memCyclesTotalRef = useRef<number>(1); // total times to play the whole range
  const memCyclesDoneRef = useRef<number>(0); // completed cycles

  // Debounced state update to prevent flickering
  const debouncedSetAudioState = (newState: Partial<AudioState>) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      setAudioState(prev => ({ ...prev, ...newState }));
    }, 50); // Small debounce to batch state updates
  };

  // Keep settings ref updated
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Update playback rate when settings change with debounce
  useEffect(() => {
    if (sound) {
      const timeoutId = setTimeout(async () => {
        try {
          await sound.setRateAsync(settings.playbackRate, true);
        } catch (error) {
          console.error('Error updating playback rate:', error);
        }
      }, 150); // Increased debounce to 150ms for better audio stability

      return () => clearTimeout(timeoutId);
    }
  }, [settings.playbackRate, sound]);

  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  const setVersesForAutoplay = (verses: VerseType[]) => {
    const targetSurah = verses[0]?.surahNumber;
    const playingSurah = audioState.currentVerse?.surahNumber;
    const pending = pendingSurahRef.current;

    logger.debug('🔄 setVersesForAutoplay called:', {
      targetSurah,
      playingSurah,
      pendingTransition: pending,
      versesCount: verses.length,
      stackTrace: new Error().stack?.split('\n')[1]?.trim()
    });

    // Accept if:
    // - No audio is playing and no pending transition
    // - We are transitioning and this update matches the pending target
    // - We are not transitioning and this update matches the currently playing surah
    const canAccept = (!playingSurah && !pending)
      || (pending !== null && targetSurah === pending)
      || (pending === null && playingSurah === targetSurah);

    if (canAccept) {
      logger.debug('✅ setVersesForAutoplay ACCEPTED for surah', targetSurah);
      setAllVerses(verses);
      allVersesRef.current = verses;
    } else {
      logger.debug('❌ setVersesForAutoplay REJECTED:', {
        playingSurah,
        targetSurah,
        pendingTransition: pending,
      });
    }
  };

  const playNextVerse = (currentVerse?: VerseType) => {
    // Use the passed verse or fall back to state
    const verseToUse = currentVerse || audioState.currentVerse;
    logger.debug(`Attempting to play next verse. Current verse ID: ${verseToUse?.id}`);

    // Use ref to get current settings value (avoid closure issues)
    const versesArr = allVersesRef.current;
    if (!settingsRef.current.autoplayEnabled || !verseToUse || !versesArr.length) {
      logger.debug('Autoplay conditions not met:', {
        autoplayEnabled: settingsRef.current.autoplayEnabled,
        hasCurrentVerse: !!verseToUse,
        hasAllVerses: versesArr.length > 0
      });
      return;
    }

    const currentIndex = versesArr.findIndex(v => v.id === verseToUse.id);
    const nextIndex = currentIndex + 1;
    logger.debug(`Autoplay: Current index ${currentIndex}, moving to next index ${nextIndex}`);

    // If current verse is not in the allVerses array (index -1), don't try to play next
    if (currentIndex === -1) {
      logger.debug('Current verse not found in allVerses array, skipping autoplay');
      return;
    }

    if (nextIndex < versesArr.length) {
      const nextVerse = versesArr[nextIndex];
      logger.debug(`Next verse found: ${nextVerse.id} (Surah ${nextVerse.surahNumber}, Verse ${nextVerse.number})`);
      playVerse(nextVerse);
    } else {
      logger.debug('Reached end of surah');
      const mode = settingsRef.current.audioPlayMode;
      if (mode === 'loopSurah') {
        const firstVerse = versesArr[0];
        logger.debug('Looping surah from the beginning');
        playVerse(firstVerse);
      } else if (mode === 'nextSurah') {
        const currentSurah = verseToUse.surahNumber;
        const nextSurah = currentSurah + 1;
        if (nextSurah <= 114) {
          // Build a verse object for 1st verse of next surah using existing data if present; otherwise, minimal stub until load
          const firstOfNext = versesArr.find(v => v.surahNumber === nextSurah && v.number === 1);
          if (firstOfNext) {
            logger.debug('Continuing to next surah, verse 1');
            playVerse(firstOfNext);
          } else {
            // Load next surah verses and continue
            (async () => {
              try {
                // Keep UI visible while fetching next surah
                setAudioState(prev => ({ ...prev, isLoading: true }));
                logger.debug('Loading next surah', nextSurah, 'for continuous playback');
                pendingSurahRef.current = nextSurah;
                const loaded = await loadSurah(nextSurah);
                if (loaded && loaded.verses.length > 0) {
                  setAllVerses(loaded.verses);
                  allVersesRef.current = loaded.verses;
                  await playVerse(loaded.verses[0]);
                  pendingSurahRef.current = null;
                } else {
                  logger.debug('Failed to load next surah or no verses; stopping');
                  pendingSurahRef.current = null;
                  stop();
                }
              } catch (e) {
                console.error('Error loading next surah:', e);
                pendingSurahRef.current = null;
                stop();
              }
            })();
          }
        } else {
          logger.debug('No next surah exists; stopping');
          stop();
        }
      } else if (mode === 'stopAtEnd') {
        logger.debug('Stopping at end of surah per mode');
        stop();
      } else if (mode === 'loopVerse') {
        const firstVerse = versesArr[currentIndex];
        logger.debug('Looping current verse');
        playVerse(firstVerse);
      } else {
        stop();
      }
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

      const getReciterFolder = () => {
        const selectedReciter = availableReciters.find(r => r.id === settings.selectedReciter);
        return selectedReciter ? selectedReciter.folder : 'sudais_all_verse'; // Default fallback
      };

      const audioUri = `${getBaseUrl()}/${getReciterFolder()}/${audioFileName}`;
      logger.debug(`Attempting to load audio from: ${audioUri}`);

      // Load and play the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);

      // Set playback rate
      await newSound.setRateAsync(settings.playbackRate, true);

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
            // Small delay before checking settings to ensure latest values
            setTimeout(async () => {
              // Memorization mode overrides normal autoplay/play mode
              if (memActiveRef.current) {
                const versesArr = allVersesRef.current;
                const targetSurah = memSurahRef.current;
                const startNum = memStartRef.current;
                const endNum = memEndRef.current;

                // If we somehow left the target surah, cancel memorization
                if (!targetSurah || verse.surahNumber !== targetSurah) {
                  memActiveRef.current = false;
                  memCyclesDoneRef.current = 0;
                  setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                  return;
                }

                // Move to next verse within range
                if (verse.number < endNum) {
                  const next = versesArr.find(v => v.surahNumber === targetSurah && v.number === verse.number + 1);
                  if (next) {
                    await playVerse(next);
                    return;
                  }
                  // If next not found, cancel memorization gracefully
                  memActiveRef.current = false;
                  setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                  return;
                }

                // Finished the end of the range; either loop the whole range or stop
                const cyclesDone = memCyclesDoneRef.current + 1;
                if (cyclesDone < Math.max(1, memCyclesTotalRef.current)) {
                  memCyclesDoneRef.current = cyclesDone;
                  const startVerse = versesArr.find(v => v.surahNumber === targetSurah && v.number === startNum);
                  if (startVerse) {
                    await playVerse(startVerse);
                    return;
                  }
                  // Start not found; cancel
                  memActiveRef.current = false;
                  memCyclesDoneRef.current = 0;
                  setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                  return;
                } else {
                  // All cycles completed
                  memActiveRef.current = false;
                  memCyclesDoneRef.current = 0;
                  setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                  return;
                }
              }

              const mode = settingsRef.current.audioPlayMode;

              // Loop current verse immediately
              if (mode === 'loopVerse') {
                await playVerse(verse);
                return;
              }

              // Determine if this was the last verse of current surah buffer
              const versesArr = allVersesRef.current;
              const idx = versesArr.findIndex(v => v.id === verse.id);
              const isLastVerse = idx !== -1 && idx === versesArr.length - 1;

              if (!isLastVerse) {
                // Not last verse: follow autoplay toggle for next-verse behavior
                if (settingsRef.current.autoplayEnabled) {
                  playNextVerse(verse);
                } else {
                  setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                }
                return;
              }

              // End-of-surah behavior: ignore autoplay flag and follow play mode
              if (mode === 'loopSurah') {
                const first = versesArr[0];
                if (first) await playVerse(first);
                else setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                return;
              }

              if (mode === 'nextSurah') {
                try {
                  const nextSurah = verse.surahNumber + 1;
                  if (nextSurah <= 114) {
                    const loaded = await loadSurah(nextSurah);
                    if (loaded && loaded.verses.length > 0) {
                      // CRITICAL: Update allVerses BEFORE playing to avoid index -1 lookup
                      setAllVerses(loaded.verses);
                      allVersesRef.current = loaded.verses;
                      logger.debug('Updated allVerses to next surah in finish handler, length:', loaded.verses.length);
                      await playVerse(loaded.verses[0]);
                    } else {
                      setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                    }
                  } else {
                    setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                  }
                } catch (e) {
                  console.error('Error loading next surah on finish:', e);
                  setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
                }
                return;
              }

              // stopAtEnd or unknown mode
              setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
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

      logger.debug(`Successfully loaded and playing: ${audioFileName} for verse ${verse.id}`);

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
      pendingSurahRef.current = null;
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

  const changePlaybackRate = async (rate: number) => {
    if (sound) {
      try {
        await sound.setRateAsync(rate, true);
        logger.debug(`Playback rate changed to: ${rate}x`);
      } catch (error) {
        console.error('Error changing playback rate:', error);
      }
    }
  };

  // Start memorization over a range within a single surah.
  // Each verse in the range is repeated `repeatsPerVerse` times, then proceeds to the next.
  const startMemorization = async (
    surahNumber: number,
    startVerseNumber: number,
    endVerseNumber: number,
    repeatsForWholeRange: number
  ) => {
    try {
      // Normalize inputs
      const startNum = Math.max(1, Math.floor(startVerseNumber));
      let endNum = Math.max(startNum, Math.floor(endVerseNumber));
      const cycles = Math.max(1, Math.floor(repeatsForWholeRange));

      // Ensure we have the correct surah verses loaded
      if (!allVersesRef.current.length || allVersesRef.current[0].surahNumber !== surahNumber) {
        pendingSurahRef.current = surahNumber;
        const loaded = await loadSurah(surahNumber);
        pendingSurahRef.current = null;
        if (!loaded || !loaded.verses.length) {
          console.warn('Unable to load surah for memorization');
          return;
        }
        setAllVerses(loaded.verses);
        allVersesRef.current = loaded.verses;
      }

      // Optional clamp: ensure end doesn't exceed this surah's total verses
      const versesArr = allVersesRef.current;
      const maxNumInSurah = versesArr.reduce((max, v) => v.surahNumber === surahNumber ? Math.max(max, v.number) : max, 0);
      if (maxNumInSurah > 0) {
        endNum = Math.min(endNum, maxNumInSurah);
      }

      // Find starting verse
      const startVerse = versesArr.find(v => v.surahNumber === surahNumber && v.number === startNum);
      if (!startVerse) {
        console.warn('Start verse not found for memorization');
        return;
      }

      // Initialize memorization state
      memActiveRef.current = true;
      memSurahRef.current = surahNumber;
      memStartRef.current = startNum;
      memEndRef.current = endNum;
      memCyclesTotalRef.current = cycles;
      memCyclesDoneRef.current = 0;

      // Begin playback at start verse
      await playVerse(startVerse);
    } catch (error) {
      console.error('Error starting memorization:', error);
    }
  };

  const cancelMemorization = () => {
    memActiveRef.current = false;
    memCyclesDoneRef.current = 0;
  };

  return {
    audioState,
    playVerse,
    pause,
    resume,
    stop,
    togglePlayPause,
    changePlaybackRate,
    setVersesForAutoplay,
    startMemorization,
    cancelMemorization,
  };
};
