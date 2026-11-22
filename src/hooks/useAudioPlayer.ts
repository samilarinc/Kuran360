import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Verse as VerseType, AudioState } from '@/types';
import { loadSurah } from '@/data/quranData';
import { useSettings } from '@/contexts/SettingsContext';
import logger from '@/utils/logger';
import { getVerseAudioUrl } from '@/utils/audioUrls';
import { getSurahNameByNumber } from '@/utils/surahName';
import {
  AudioPlayer, LockScreenCommand, PlayerStatus, loadPlayer, onLockScreenCommand, onStatus, releasePlayer, showOnLockScreen,
} from '@/services/audioPlayer';

// Next verse starts this long before the current one ends. Every file opens with ~35 ms of
// silence, so the overlap only covers the player's own start-up latency.
const OVERLAP_LEAD_MS = 60;
// How long the previous sound may keep playing its tail before it is unloaded
const OVERLAP_UNLOAD_DELAY_MS = 1000;
// How often the player reports its position (word highlighting follows it)
const POSITION_UPDATE_INTERVAL_MS = 100;
// A verse file that hasn't loaded by then counts as failed, so a stalled download can't hang playback
const LOAD_TIMEOUT_MS = 15000;
// A failed load is tried this many more times (after a short pause) before playback stops with an error
const LOAD_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

// "Previous" restarts the verse when it has played longer than this, otherwise goes to the verse before
const RESTART_THRESHOLD_SECONDS = 3;

const createSoundWithTimeout = (uri: string, rate?: number) =>
  loadPlayer(uri, { timeoutMs: LOAD_TIMEOUT_MS, updateIntervalMs: POSITION_UPDATE_INTERVAL_MS, rate });

type PositionListener = (verseId: string, positionMillis: number) => void;

export const useAudioPlayer = () => {
  const { settings, availableReciters } = useSettings();
  const { t } = useTranslation();
  const settingsRef = useRef(settings);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentVerse: null,
    duration: 0,
    position: 0,
    isLoading: false,
  });
  const [sound, setSound] = useState<AudioPlayer | null>(null);
  const [_allVerses, setAllVerses] = useState<VerseType[]>([]);
  // Keep a ref in sync with allVerses to avoid stale closures inside audio callbacks
  const allVersesRef = useRef<VerseType[]>([]);
  // Protect cross-surah transitions from being overwritten by UI updates
  const pendingSurahRef = useRef<number | null>(null);
  // Cancel token for current playback session; increment to invalidate pending timers/callbacks
  const playTokenRef = useRef(0);

  // Current sound as a ref, so audio callbacks never see a stale `sound` state
  const soundRef = useRef<AudioPlayer | null>(null);
  // Status / lock screen listeners of the current sound, removed when another sound takes over
  const detachRef = useRef<(() => void) | null>(null);
  // Lets replayVerse start the current sound's finish handling over
  const rearmRef = useRef<(() => void) | null>(null);
  // Verse of the current sound, for the media notification's previous/next buttons
  const currentVerseRef = useRef<VerseType | null>(null);
  // Latest previous/next handler; the notification listener calls it through this ref
  const lockCommandRef = useRef<(command: LockScreenCommand) => void>(() => { });
  // Set while the next verse is started just before the current one ends (see OVERLAP_LEAD_MS)
  const overlapNextRef = useRef(false);
  // Upcoming verse audio, keyed by URI (so a reciter change never hits a stale entry).
  // Promises, so a transition can wait for an in-flight preload instead of downloading again.
  const preloadCache = useRef<Map<string, Promise<AudioPlayer | null>>>(new Map());

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
          sound.setPlaybackRate(settings.playbackRate);
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
  useEffect(() => () => {
    detachRef.current?.();
    releasePlayer(soundRef.current);
  }, []);

  // Clean up preloaded audio cache
  useEffect(() => {
    const cache = preloadCache.current;
    return () => {
      // Clean up all preloaded sounds on unmount
      cache.forEach(pending => pending.then(releasePlayer).catch(() => { }));
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

    const pending = createSoundWithTimeout(uri)
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
      preloadCache.current.get(oldestKey)?.then(releasePlayer).catch(() => { });
      preloadCache.current.delete(oldestKey);
    }
  };

  // Takes a preloaded (or still loading) sound out of the cache; null on a miss
  const takePreloaded = async (verse: VerseType): Promise<AudioPlayer | null> => {
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
      rearmRef.current?.();
      await current.seekTo(0);
      current.play();
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
      setAudioState(prev => ({ ...prev, isLoading: true, loadError: false }));

      // Stop the previous sound without waiting for it; the next one starts loading right away.
      // When started early (overlap), the previous verse plays its last few ms to the end first.
      // It is released only once this one has taken over the media notification (or this one fails),
      // so the notification and its foreground service stay up between verses.
      const overlap = overlapNextRef.current;
      overlapNextRef.current = false;
      const previous = soundRef.current;
      detachRef.current?.();
      detachRef.current = null;
      rearmRef.current = null;
      if (previous && !overlap) previous.pause();
      soundRef.current = null;
      let previousReleased = !previous;
      const releasePrevious = () => {
        if (previousReleased) return;
        previousReleased = true;
        if (overlap) setTimeout(() => releasePlayer(previous), OVERLAP_UNLOAD_DELAY_MS);
        else releasePlayer(previous);
      };

      try {
        const audioUri = getAudioUri(verse);
        const rate = settingsRef.current.playbackRate;

        // Preloaded (or still preloading) sound for this verse, if any
        let newSound = await takePreloaded(verse);
        if (myToken !== playTokenRef.current) {
          releasePlayer(newSound);
          return;
        }

        if (newSound) {
          logger.debug(`Using preloaded audio for verse: ${audioUri}`);
          try {
            newSound.setPlaybackRate(rate);
            newSound.play();
          } catch (error) {
            // The preloaded player broke while waiting (e.g. its connection dropped); load the file again
            logger.debug(`Preloaded audio unusable, reloading: ${audioUri} ${error}`);
            releasePlayer(newSound);
            newSound = null;
          }
        }

        if (!newSound) {
          logger.debug(`Loading audio from: ${audioUri}`);
          // A missing file rejects here, so no separate HEAD request is needed
          for (let attempt = 0; !newSound; attempt++) {
            try {
              newSound = await createSoundWithTimeout(audioUri, rate);
            } catch (error) {
              if (myToken !== playTokenRef.current) return;
              if (attempt >= LOAD_RETRIES) {
                logger.warn(`Audio could not be loaded: ${audioUri}`, error);
                failPlayback(verse);
                return;
              }
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              if (myToken !== playTokenRef.current) return;
            }
          }
          // A newer play/stop happened while this was loading
          if (myToken !== playTokenRef.current) {
            releasePlayer(newSound);
            return;
          }
          newSound.play();
        }

        soundRef.current = newSound;
        currentVerseRef.current = verse;
        setSound(newSound);

        // Media notification / lock screen: takes over from the previous verse's sound, then that one goes
        const reciterName = availableReciters.find(r => r.id === settingsRef.current.selectedReciter)?.name;
        showOnLockScreen(newSound, `${getSurahNameByNumber(t, verse.surahNumber)} ${verse.number}`, reciterName);
        releasePrevious();

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

        // Android reports the end more than once (state change and playing change); handle it once
        let finishHandled = false;
        rearmRef.current = () => {
          finishHandled = false;
          startedEarly = false;
        };
        const player = newSound;
        const statusSubscription = onStatus(player, (status: PlayerStatus) => {
          if (myToken !== playTokenRef.current) return;
          if (status.error) {
            // The player stopped with an error mid-verse (e.g. the connection dropped): stop and say so
            // instead of staying "playing" with no sound
            logger.warn(`Audio playback error: ${audioUri}`, status.error);
            clearEarlyTimer();
            playTokenRef.current++;
            detachRef.current?.();
            detachRef.current = null;
            player.clearLockScreenControls();
            releasePlayer(player);
            failPlayback(verse);
            return;
          }
          const positionMillis = (status.currentTime || 0) * 1000;
          const durationMillis = (status.duration || 0) * 1000;
          positionListenersRef.current.forEach(listener => listener(verse.id, positionMillis));
          // Position ticks alone don't touch audioState (nothing reads it; see subscribeToPosition)
          setAudioState(prev => {
            const isPlaying = status.playing || false;
            if (prev.isPlaying === isPlaying && prev.duration === durationMillis && !prev.isLoading) return prev;
            return { ...prev, isPlaying, duration: durationMillis, position: positionMillis, isLoading: false };
          });

          clearEarlyTimer();
          if (status.didJustFinish) {
            if (finishHandled) return;
            finishHandled = true;
            if (!startedEarly) handleFinished();
            return;
          }
          if (status.playing && durationMillis) {
            const remainingMs = (durationMillis - positionMillis) / (status.playbackRate || 1);
            earlyTimer = setTimeout(startNextEarly, Math.max(0, remainingMs - OVERLAP_LEAD_MS));
          }
        });
        const commandSubscription = onLockScreenCommand(player, command => lockCommandRef.current(command));
        detachRef.current = () => {
          clearEarlyTimer();
          statusSubscription.remove();
          commandSubscription.remove();
        };

        setAudioState(prev => ({
          ...prev,
          currentVerse: verse,
          isPlaying: true,
          isLoading: false,
        }));

        logger.debug(`Successfully loaded and playing verse: ${verse.id}`);

        // Start downloading whatever plays next while this verse plays
        preloadUpcoming(verse);
      } finally {
        releasePrevious();
      }

    } catch (error) {
      console.error('Error playing audio:', error);
      failPlayback(verse);
    }
  };

  // Media notification / lock screen buttons. "Next" goes to the following verse (the next surah after
  // the last one); "previous" restarts the verse, or goes to the one before when it has just started.
  // In memorization they stay within the range.
  lockCommandRef.current = (command: LockScreenCommand) => {
    const verse = currentVerseRef.current;
    const current = soundRef.current;
    if (!verse) return;
    const versesArr = allVersesRef.current;
    const inSurah = (num: number) => versesArr.find(v => v.surahNumber === verse.surahNumber && v.number === num);

    if (command === 'previous') {
      const playedSeconds = current?.currentTime ?? 0;
      const atRangeStart = memActiveRef.current && verse.number <= memStartRef.current;
      const before = atRangeStart ? undefined : inSurah(verse.number - 1);
      if (playedSeconds > RESTART_THRESHOLD_SECONDS || !before) {
        rearmRef.current?.();
        current?.seekTo(0).then(() => current.play()).catch(() => { });
        return;
      }
      memCurrentVerseRepeatsRef.current = 0;
      playVerse(before);
      return;
    }

    if (memActiveRef.current) {
      memCurrentVerseRepeatsRef.current = 0;
      const next = verse.number < memEndRef.current ? inSurah(verse.number + 1) : inSurah(memStartRef.current);
      if (next) playVerse(next);
      return;
    }
    const next = inSurah(verse.number + 1);
    if (next) {
      playVerse(next);
      return;
    }
    if (verse.surahNumber >= 114) return;
    const myToken = playTokenRef.current;
    pendingSurahRef.current = verse.surahNumber + 1;
    loadSurah(verse.surahNumber + 1)
      .then(loaded => {
        pendingSurahRef.current = null;
        if (!loaded?.verses.length || myToken !== playTokenRef.current) return;
        setAllVerses(loaded.verses);
        allVersesRef.current = loaded.verses;
        playVerse(loaded.verses[0]);
      })
      .catch(() => { pendingSurahRef.current = null; });
  };

  // Recitation over (end of the surah or range): take it off the notification and lock screen
  useEffect(() => {
    if (!audioState.currentVerse) {
      try { soundRef.current?.clearLockScreenControls(); } catch { }
    }
  }, [audioState.currentVerse]);

  // Stops on a verse whose audio couldn't play and flags it; the audio bar shows the error and its
  // play button tries again. Nothing advances, so autoplay can't skip through verses in silence.
  const failPlayback = (verse: VerseType) => {
    soundRef.current = null;
    currentVerseRef.current = null;
    setSound(null);
    setAudioState(prev => ({
      ...prev,
      currentVerse: verse,
      isPlaying: false,
      isLoading: false,
      loadError: true,
      duration: 0,
      position: 0,
    }));
  };

  const pause = async () => {
    try {
      soundRef.current?.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resume = async () => {
    try {
      soundRef.current?.play();
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
        detachRef.current?.();
        detachRef.current = null;
        rearmRef.current = null;
        try { current.clearLockScreenControls(); } catch { }
        releasePlayer(current);
        setSound(null);
      }
      currentVerseRef.current = null;
      pendingSurahRef.current = null;
      setAudioState({
        isPlaying: false,
        currentVerse: null,
        duration: 0,
        position: 0,
        isLoading: false,
        loadError: false,
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
    } else if (audioState.currentVerse && !soundRef.current && !audioState.isLoading) {
      // Nothing loaded for this verse (its audio failed): try it again
      await playVerse(audioState.currentVerse);
    } else if (audioState.currentVerse) {
      await resume();
    }
  };

  const changePlaybackRate = async (rate: number) => {
    if (soundRef.current) {
      try {
        soundRef.current.setPlaybackRate(rate);
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
      const previewSound = await createSoundWithTimeout(audioUri, settings.playbackRate);
      previewSound.play();

      soundRef.current = previewSound;
      setSound(previewSound);
      setAudioState(prev => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
        currentVerse: verse,
      }));

      // Set up playback status update for preview
      const previewSubscription = onStatus(previewSound, (status) => {
        if (status.didJustFinish) {
          previewSubscription.remove();
          detachRef.current = null;
          // Preview finished, reset state
          setAudioState(prev => ({
            ...prev,
            isPlaying: false,
            currentVerse: null,
            position: 0,
          }));
          releasePlayer(previewSound);
          soundRef.current = null;
          setSound(null);
        } else {
          setAudioState(prev => ({
            ...prev,
            position: (status.currentTime || 0) * 1000,
            duration: (status.duration || 0) * 1000,
          }));
        }
      });
      detachRef.current = () => previewSubscription.remove();

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
