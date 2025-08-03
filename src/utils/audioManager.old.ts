import TrackPlayer, { 
  Capability, 
  State, 
  Track,
  RepeatMode,
  Event,
  useTrackPlayerEvents
} from 'react-native-track-player';
import { Verse } from '../types';
import { AUDIO_FILE_FORMAT } from '../constants';

class AudioManager {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
        ],
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing audio player:', error);
    }
  }

  async playVerse(verse: Verse) {
    try {
      await this.initialize();
      
      // Clear the current queue
      await TrackPlayer.reset();
      
      // Add the verse track
      const track: Track = {
        id: `${verse.surahNumber}-${verse.verseNumber}`,
        url: this.getAudioPath(verse.audioFileName),
        title: `Surah ${verse.surahNumber}, Verse ${verse.verseNumber}`,
        artist: 'Abdul Rahman Al-Sudais',
        artwork: undefined, // You can add artwork later
      };
      
      await TrackPlayer.add(track);
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing verse:', error);
    }
  }

  async pause() {
    try {
      await TrackPlayer.pause();
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }

  async resume() {
    try {
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  }

  async stop() {
    try {
      await TrackPlayer.stop();
      await TrackPlayer.reset();
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  async getState(): Promise<State> {
    try {
      return await TrackPlayer.getState();
    } catch (error) {
      console.error('Error getting player state:', error);
      return State.None;
    }
  }

  async getPosition(): Promise<number> {
    try {
      return await TrackPlayer.getPosition();
    } catch (error) {
      console.error('Error getting position:', error);
      return 0;
    }
  }

  async getDuration(): Promise<number> {
    try {
      return await TrackPlayer.getDuration();
    } catch (error) {
      console.error('Error getting duration:', error);
      return 0;
    }
  }

  private getAudioPath(fileName: string): string {
    // For local files in the assets directory
    // Note: In production, you might want to bundle these in the app
    // or load from a remote CDN
    return `file:///home/samil/quran/QuranApp/assets/audio/${fileName}`;
  }
}

export const audioManager = new AudioManager();
