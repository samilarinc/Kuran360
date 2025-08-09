import { Verse } from '../types';
import logger from './logger';

class AudioManager {
    private currentVerse: Verse | null = null;
    private isPlaying: boolean = false;

    async playVerse(verse: Verse): Promise<void> {
        try {
            this.currentVerse = verse;
            this.isPlaying = true;
            logger.debug(`Playing verse: ${verse.audioFileName}`);
            // TODO: Implement with Expo AV
        } catch (error) {
            console.error('Error playing verse:', error);
            throw error;
        }
    }

    async pause(): Promise<void> {
        try {
            this.isPlaying = false;
            logger.debug('Pausing audio');
            // TODO: Implement with Expo AV
        } catch (error) {
            console.error('Error pausing audio:', error);
            throw error;
        }
    }

    async resume(): Promise<void> {
        try {
            this.isPlaying = true;
            logger.debug('Resuming audio');
            // TODO: Implement with Expo AV
        } catch (error) {
            console.error('Error resuming audio:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        try {
            this.isPlaying = false;
            this.currentVerse = null;
            logger.debug('Stopping audio');
            // TODO: Implement with Expo AV
        } catch (error) {
            console.error('Error stopping audio:', error);
            throw error;
        }
    }

    async getDuration(): Promise<number> {
        // TODO: Implement with Expo AV
        return 0;
    }

    async getPosition(): Promise<number> {
        // TODO: Implement with Expo AV
        return 0;
    }

    getCurrentVerse(): Verse | null {
        return this.currentVerse;
    }

    getIsPlaying(): boolean {
        return this.isPlaying;
    }
}

export const audioManager = new AudioManager();
