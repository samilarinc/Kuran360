import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Verse as VerseType, AudioState } from '@/types';
import { loadSurah } from '@/data/quranData';
import { useSettings } from '@/contexts/SettingsContext';
import logger from '@/utils/logger';
import { getVerseAudioUrl } from '@/utils/audioUrls';

// Next verse starts this long before the current one ends. Every file opens with ~35 ms of
// silence, so the overlap only covers the player's own start-up latency.
const OVERLAP_LEAD_MS = 60;
// How long the previous sound may keep playing its tail before it is unloaded
const OVERLAP_UNLOAD_DELAY_MS = 1000;
// How often the player reports its position (word highlighting follows it); expo-av defaults to 500 ms
const POSITION_UPDATE_INTERVAL_MS = 100;

type PositionListener = (verseId: string, positionMillis: number) => void;

export const useAudioPlayer = () => {
  const { settings, availableReciters } = useSettings();
  const settingsRef = useRef(settings);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentVerse: null,
    duration: 0,
    position: 0,
    isLoading: false,
  });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [_allVerses, setAllVerses] = useState<VerseType[]>([]);
  // Keep a ref in sync with allVerses to avoid stale closures inside audio callbacks
  const allVersesRef = useRef<VerseType[]>([]);
  // Protect cross-surah transitions from being overwritten by UI updates
  const pendingSurahRef = useRef<number | null>(null);
  // Cancel token for current playback session; increment to invalidate pending timers/callbacks
  const playTokenRef = useRef(0);

  // Current sound as a ref, so audio callbacks never see a stale `sound` state
  const soundRef = useRef<Audio.Sound | null>(null);
  // Set while the next verse is started just before the current one ends (see OVERLAP_LEAD_MS)
  const overlapNextRef = useRef(false);
  // Upcoming verse audio, keyed by URI (so a reciter change never hits a stale entry).
  // Promises, so a transition can wait for an in-flight preload instead of downloading again.
  const preloadCache = useRef<Map<string, Promise<Audio.Sound | null>>>(new Map());

  // Position ticks go straight to subscribers instead of through audioState, so only the
  // components that follow the recitation re-render ten times a second
  const positionListenersRef = useRef<Set<PositionListener>>(new Set());
  const subscribeToPosition = useCallback((listener: PositionListener) => {
    positionListenersRef.current.add(listener);
    return () => { positionListenersRef.current.delete(listener); };
  }, []);

  // Memorization mode state (range within a single surah, repeating the whole range N times)
  const memActiveRef = useRef(false);
  const memSurahRef = useRef<number | null>(null);
  const memStartRef = useRef<number>(1);
  const memEndRef = useRef<number>(1);
  const memCyclesTotalRef = useRef<number>(1); // total times to play the whole range
  const memCyclesDoneRef = useRef<number>(0); // completed cycles

  // Mode switch: 'range' = old mode (repeat whole range), 'individual' = new mode (repeat each verse)
  const memModeRef = useRef<'range' | 'individual'>('range');
  const memCurrentVerseRepeatsRef = useRef<number>(0); // how many times current verse has been repeated

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
    soundRef.current = sound;
  }, [sound]);

  // Sounds are unloaded explicitly in playVerse/stop (an overlapping tail must be allowed to finish)
  useEffect(() => () => { soundRef.current?.unloadAsync().catch(() => { }); }, []);

  // Clean up preloaded audio cache
  useEffect(() => {
    const cache = preloadCache.current;
    return () => {
      // Clean up all preloaded sounds on unmount
      cache.forEach(pending => pending.then(s => s?.unloadAsync()).catch(() => { }));
      cache.clear();
    };
  }, []);

  // Helper function to get audio URI for a verse
  const getAudioUri = (verse: VerseType) => {
    const selectedReciter = availableReciters.find(r => r.id === settings.selectedReciter);
    return getVerseAudioUrl(verse.surahNumber, verse.number, selectedReciter?.folder);
  };

  // Start downloading a verse's audio in the background (no-op if already cached / in flight)
  const preloadVerse = (verse: VerseType) => {
    const uri = getAudioUri(verse);
    if (preloadCache.current.has(uri)) return;

    const pending = Audio.Sound.createAsync({ uri }, { shouldPlay: false })
      .then(({ sound: preloaded }) => preloaded)
      .catch(error => {
        logger.debug(`Failed to preload verse audio: ${uri} ${error}`);
        preloadCache.current.delete(uri);
        return null;
      });
    preloadCache.current.set(uri, pending);
    logger.debug(`Preloading verse: ${uri}`);

    // Keep only a few recent entries
    if (preloadCache.current.size > 3) {
      const oldestKey = preloadCache.current.keys().next().value as string;
      preloadCache.current.get(oldestKey)?.then(s => s?.unloadAsync()).catch(() => { });
      preloadCache.current.delete(oldestKey);
    }
  };

  // Takes a preloaded (or still loading) sound out of the cache; null on a miss
  const takePreloaded = async (verse: VerseType): Promise<Audio.Sound | null> => {
    const uri = getAudioUri(verse);
    const pending = preloadCache.current.get(uri);
    if (!pending) return null;
    preloadCache.current.delete(uri);
    return pending;
  };

  /**
   * The verse that will play after `verse` finishes, mirroring the finish handler below
   * (memorization > loopVerse > autoplay > end-of-surah mode). Used to preload its audio.
   * Returns null when nothing follows or it isn't loaded yet (next surah is handled separately).
   */
  const getUpcomingVerse = (verse: VerseType): VerseType | null => {
    const versesArr = allVersesRef.current;
    const findInSurah = (num: number) => versesArr.find(v => v.surahNumber === verse.surahNumber && v.number === num) ?? null;

    if (memActiveRef.current) {
      if (memModeRef.current === 'individual' && memCurrentVerseRepeatsRef.current + 1 < memCyclesTotalRef.current) {
        return verse;
      }
      if (verse.number < memEndRef.current) return findInSurah(verse.number + 1);
      if (memModeRef.current === 'range' && memCyclesDoneRef.current + 1 < Math.max(1, memCyclesTotalRef.current)) {
        return findInSurah(memStartRef.current);
      }
      return null;
    }

    const mode = settingsRef.current.audioPlayMode;
    if (mode === 'loopVerse') return verse;

    const idx = versesArr.findIndex(v => v.id === verse.id);
    if (idx === -1) return null;
    if (idx < versesArr.length - 1) return settingsRef.current.autoplayEnabled ? versesArr[idx + 1] : null;
    if (mode === 'loopSurah') return versesArr[0] ?? null;
    return null;
  };

  // Preload whatever plays next, including verse 1 of the next surah in 'nextSurah' mode
  const preloadUpcoming = (verse: VerseType) => {
    const upcoming = getUpcomingVerse(verse);
    if (upcoming) {
      // Repeating the same verse replays the current sound; nothing to download
      if (upcoming.id !== verse.id) preloadVerse(upcoming);
      return;
    }
    const versesArr = allVersesRef.current;
    const isLastVerse = versesArr.length > 0 && versesArr[versesArr.length - 1].id === verse.id;
    if (!memActiveRef.current && isLastVerse && settingsRef.current.audioPlayMode === 'nextSurah' && verse.surahNumber < 114) {
      loadSurah(verse.surahNumber + 1)
        .then(next => { if (next?.verses[0]) preloadVerse(next.verses[0]); })
        .catch(() => { });
    }
  };

  // Restart the current sound from the beginning (loopVerse / memorization repeats) without reloading
  const replayVerse = async (verse: VerseType) => {
    const current = soundRef.current;
    if (!current) return playVerse(verse);
    try {
      await current.replayAsync();
      preloadUpcoming(verse);
    } catch {
      await playVerse(verse);
    }
  };

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
      // Start a new play session; invalidate previous timers/callbacks
      const myToken = ++playTokenRef.current;
      setAudioState(prev => ({ ...prev, isLoading: true }));

      // Stop the previous sound without waiting for it; the next one starts loading right away.
      // When started early (overlap), the previous verse plays its last few ms to the end first.
      const overlap = overlapNextRef.current;
      overlapNextRef.current = false;
      const previous = soundRef.current;
      if (previous) {
        previous.setOnPlaybackStatusUpdate(null);
        if (overlap) {
          setTimeout(() => { previous.unloadAsync().catch(() => { }); }, OVERLAP_UNLOAD_DELAY_MS);
        } else {
          previous.unloadAsync().catch(() => { });
        }
        soundRef.current = null;
      }

      const audioUri = getAudioUri(verse);
      const playbackStatus = { shouldPlay: true, rate: settingsRef.current.playbackRate, shouldCorrectPitch: true };

      // Preloaded (or still preloading) sound for this verse, if any
      let newSound = await takePreloaded(verse);
      if (myToken !== playTokenRef.current) {
        newSound?.unloadAsync().catch(() => { });
        return;
      }

      if (newSound) {
        logger.debug(`Using preloaded audio for verse: ${audioUri}`);
        await newSound.setStatusAsync(playbackStatus);
      } else {
        logger.debug(`Loading audio from: ${audioUri}`);
        try {
          // A missing file rejects here, so no separate HEAD request is needed
          const { sound: loadedSound } = await Audio.Sound.createAsync({ uri: audioUri }, playbackStatus);
          newSound = loadedSound;
        } catch (error) {
          logger.debug(`Audio file not available: ${audioUri}. Using simulation mode.`);
          // Fall back to simulation if audio loading fails
          setAudioState(prev => ({
            ...prev,
            isPlaying: true,
            isLoading: false,
            currentVerse: verse,
          }));

          // Simulate verse duration (average 5 seconds)
          setTimeout(async () => {
            // Abort if a new play/stop happened
            if (myToken !== playTokenRef.current) return;
            // Simulate the same logic as didJustFinish
            if (memActiveRef.current) {
              const versesArr = allVersesRef.current;
              const targetSurah = memSurahRef.current;
              const endNum = memEndRef.current;

              if (verse.number < endNum) {
                const next = versesArr.find(v => v.surahNumber === targetSurah && v.number === verse.number + 1);
                if (next) {
                  await playVerse(next);
                  return;
                }
              }
            }

            if (settingsRef.current.autoplayEnabled) {
              playNextVerse(verse);
            } else {
              setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
            }
          }, 5000);

          return;
        }
        // A newer play/stop happened while this was loading
        if (myToken !== playTokenRef.current) {
          newSound.unloadAsync().catch(() => { });
          return;
        }
      }

      soundRef.current = newSound;
      setSound(newSound);

      // Starts the next verse OVERLAP_LEAD_MS before this one ends, so there is no audible gap.
      // A timer (re-synced on every status update) avoids needing very frequent status updates.
      let startedEarly = false;
      let earlyTimer: ReturnType<typeof setTimeout> | null = null;
      const clearEarlyTimer = () => {
        if (earlyTimer) clearTimeout(earlyTimer);
        earlyTimer = null;
      };
      const startNextEarly = () => {
        earlyTimer = null;
        if (startedEarly || myToken !== playTokenRef.current) return;
        // Only for a different verse; repeats replay this same sound after it finishes
        const upcoming = getUpcomingVerse(verse);
        if (!upcoming || upcoming.id === verse.id) return;
        startedEarly = true;
        overlapNextRef.current = true;
        handleFinished().finally(() => { overlapNextRef.current = false; });
      };

      // Everything below reads refs, so it can run the moment playback ends (or just before)
      const handleFinished = async () => {
        // Abort if a new play/stop happened
        if (myToken !== playTokenRef.current) return;
        // Memorization mode overrides normal autoplay/play mode
        if (memActiveRef.current) {
          const versesArr = allVersesRef.current;
          const targetSurah = memSurahRef.current;
          const startNum = memStartRef.current;
          const endNum = memEndRef.current;
          const mode = memModeRef.current;

          // If we somehow left the target surah, cancel memorization
          if (!targetSurah || verse.surahNumber !== targetSurah) {
            memActiveRef.current = false;
            memCyclesDoneRef.current = 0;
            memCurrentVerseRepeatsRef.current = 0;
            setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
            return;
          }

          if (mode === 'individual') {
            // New mode: repeat each verse individually
            const currentRepeats = memCurrentVerseRepeatsRef.current + 1;

            if (currentRepeats < memCyclesTotalRef.current) {
              // Repeat the same verse
              memCurrentVerseRepeatsRef.current = currentRepeats;
              await replayVerse(verse);
              return;
            } else {
              // Move to next verse
              memCurrentVerseRepeatsRef.current = 0;

              if (verse.number < endNum) {
                const next = versesArr.find(v => v.surahNumber === targetSurah && v.number === verse.number + 1);
                if (next) {
                  await playVerse(next);
                  return;
                }
              }

              // Finished all verses in range
              memActiveRef.current = false;
              memCyclesDoneRef.current = 0;
              memCurrentVerseRepeatsRef.current = 0;
              setAudioState(prev => ({ ...prev, isPlaying: false, currentVerse: null }));
              return;
            }
          } else {
            // Original mode: repeat whole range
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
        }

        const mode = settingsRef.current.audioPlayMode;

        // Loop current verse immediately
        if (mode === 'loopVerse') {
          await replayVerse(verse);
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
      };

      // Set up status update listener
      newSound.setProgressUpdateIntervalAsync(POSITION_UPDATE_INTERVAL_MS).catch(() => { });
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        positionListenersRef.current.forEach(listener => listener(verse.id, status.positionMillis || 0));
        // Position ticks alone don't touch audioState (nothing reads it; see subscribeToPosition)
        setAudioState(prev => {
          const isPlaying = status.isPlaying || false;
          const duration = status.durationMillis || 0;
          if (prev.isPlaying === isPlaying && prev.duration === duration && !prev.isLoading) return prev;
          return { ...prev, isPlaying, duration, position: status.positionMillis || 0, isLoading: false };
        });

        clearEarlyTimer();
        if (status.didJustFinish) {
          if (!startedEarly) handleFinished();
          return;
        }
        if (status.isPlaying && status.durationMillis) {
          const remainingMs = (status.durationMillis - status.positionMillis) / (status.rate || 1);
          earlyTimer = setTimeout(startNextEarly, Math.max(0, remainingMs - OVERLAP_LEAD_MS));
        }
      });

      setAudioState(prev => ({
        ...prev,
        currentVerse: verse,
        isPlaying: true,
        isLoading: false,
      }));

      logger.debug(`Successfully loaded and playing verse: ${verse.id}`);

      // Start downloading whatever plays next while this verse plays
      preloadUpcoming(verse);

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
      await soundRef.current?.pauseAsync();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resume = async () => {
    try {
      await soundRef.current?.playAsync();
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const stop = async () => {
    try {
      // Invalidate current session to cancel pending timers/callbacks
      playTokenRef.current++;
      const current = soundRef.current;
      if (current) {
        soundRef.current = null;
        // Detach status updates first to avoid stray updates
        try { current.setOnPlaybackStatusUpdate(null); } catch { }
        try { await current.stopAsync(); } catch { }
        try { await current.unloadAsync(); } catch { }
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

  // Verse play button: stops the verse if it's the one playing, otherwise plays it
  const toggleVerse = async (verse: VerseType) => {
    const isThisVersePlaying = audioState.isPlaying &&
      audioState.currentVerse?.surahNumber === verse.surahNumber &&
      audioState.currentVerse?.number === verse.number;
    if (isThisVersePlaying) {
      await stop();
    } else {
      await playVerse(verse);
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
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(rate, true);
        logger.debug(`Playback rate changed to: ${rate}x`);
      } catch (error) {
        console.error('Error changing playback rate:', error);
      }
    }
  };

  // Start memorization over a range within a single surah.
  const startMemorization = async (
    surahNumber: number,
    startVerseNumber: number,
    endVerseNumber: number,
    repetitionCount: number,
    mode: 'range' | 'individual' = 'range'
  ) => {
    try {
      // Normalize inputs
      const startNum = Math.max(1, Math.floor(startVerseNumber));
      let endNum = Math.max(startNum, Math.floor(endVerseNumber));
      const cycles = Math.max(1, Math.floor(repetitionCount));

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
      memModeRef.current = mode;
      memCurrentVerseRepeatsRef.current = 0;

      // Begin playback at start verse
      await playVerse(startVerse);
    } catch (error) {
      console.error('Error starting memorization:', error);
    }
  };

  const cancelMemorization = () => {
    memActiveRef.current = false;
    memCyclesDoneRef.current = 0;
    memCurrentVerseRepeatsRef.current = 0;
  };

  // Play preview with specific reciter without changing settings
  const playPreviewWithReciter = async (verse: VerseType, reciterId: string) => {
    try {
      // Stop any current audio
      await stop();

      const reciter = availableReciters.find(r => r.id === reciterId);
      if (!reciter) {
        console.warn('Reciter not found:', reciterId);
        return;
      }

      const audioUri = getVerseAudioUrl(verse.surahNumber, verse.number, reciter.folder);

      // Check if audio file exists
      try {
        const response = await fetch(audioUri, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Audio file not found: ${audioUri}`);
        }
      } catch (error) {
        logger.debug(`Preview audio file not available: ${audioUri}. Using simulation mode.`);
        // Show preview as playing but with simulation
        setAudioState(prev => ({
          ...prev,
          isPlaying: true,
          currentVerse: verse,
          isLoading: false,
        }));

        // Simulate playback duration (3 seconds for preview)
        setTimeout(async () => {
          setAudioState(prev => ({
            ...prev,
            isPlaying: false,
            currentVerse: null,
          }));
        }, 3000);
        return;
      }

      setAudioState(prev => ({ ...prev, isLoading: true, currentVerse: verse }));

      // Create and play the preview sound
      const { sound: previewSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, rate: settings.playbackRate }
      );

      soundRef.current = previewSound;
      setSound(previewSound);
      setAudioState(prev => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
        currentVerse: verse,
      }));

      // Set up playback status update for preview
      previewSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
          // Preview finished, reset state
          setAudioState(prev => ({
            ...prev,
            isPlaying: false,
            currentVerse: null,
            position: 0,
          }));
          previewSound.unloadAsync();
          setSound(null);
        } else {
          setAudioState(prev => ({
            ...prev,
            position: status.positionMillis || 0,
            duration: status.durationMillis || 0,
          }));
        }
      });

    } catch (error) {
      console.error('Error playing preview:', error);
      setAudioState(prev => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        currentVerse: null,
      }));
    }
  };

  return {
    audioState,
    playVerse,
    pause,
    resume,
    stop,
    togglePlayPause,
    toggleVerse,
    changePlaybackRate,
    setVersesForAutoplay,
    startMemorization,
    cancelMemorization,
    playPreviewWithReciter,
    subscribeToPosition,
  };
};
