import { createAudioPlayer, AudioPlayer, AudioStatus, AudioMetadata } from 'expo-audio';

// Web: audioPlayer.web.ts implements the same exports on an HTML audio element

export type { AudioPlayer, AudioStatus };

/**
 * expo-audio status plus `error`, which patches/expo-audio+1.1.1.patch adds when a file can't be
 * loaded or played (expo-audio itself drops these errors).
 */
export type PlayerStatus = AudioStatus & { error?: string };

/** Previous/next verse from the media notification or lock screen (patches/expo-audio+1.1.1.patch) */
export type LockScreenCommand = 'previous' | 'next';

/** Media notification artwork: the app icon from the website */
const ARTWORK_URL = 'https://kuran360.com/favicon.png';

/** Show this player in the media notification / lock screen, with previous and next buttons */
export const showOnLockScreen = (player: AudioPlayer, title: string, artist?: string) => {
    const metadata: AudioMetadata = { title, artist, artworkUrl: ARTWORK_URL };
    try {
        // The seek buttons are patched to previous/next track
        player.setActiveForLockScreen(true, metadata, { showSeekBackward: true, showSeekForward: true });
    } catch {
        // Lock screen controls are a nicety; playback goes on without them
    }
};

export const onLockScreenCommand = (player: AudioPlayer, handler: (command: LockScreenCommand) => void) => {
    // Not in expo-audio's event types: emitted by the patch
    const emitter = player as unknown as {
        addListener: (event: string, listener: (payload: { command: LockScreenCommand }) => void) => { remove: () => void };
    };
    return emitter.addListener('lockScreenCommand', payload => handler(payload.command));
};

export const onStatus = (player: AudioPlayer, handler: (status: PlayerStatus) => void) =>
    player.addListener('playbackStatusUpdate', handler as (status: AudioStatus) => void);

/** Releases a player; safe to call twice */
export const releasePlayer = (player: AudioPlayer | null | undefined) => {
    if (!player) return;
    try { player.pause(); } catch { }
    try { player.remove(); } catch { }
};

/** A player for `uri` that starts loading right away (no waiting, for short previews) */
export const createPlayer = (uri: string) => createAudioPlayer({ uri });

const isReady = (status: PlayerStatus) => status.isLoaded && status.duration > 0;

/**
 * Creates a player for `uri` and resolves once it can play; rejects when the file can't be loaded
 * or it takes longer than `timeoutMs`, releasing the player.
 */
export const loadPlayer = (uri: string, { timeoutMs, updateIntervalMs, rate }: { timeoutMs: number; updateIntervalMs: number; rate?: number }) =>
    new Promise<AudioPlayer>((resolve, reject) => {
        const player = createAudioPlayer({ uri }, { updateInterval: updateIntervalMs });
        player.shouldCorrectPitch = true;
        if (rate && rate !== 1) player.setPlaybackRate(rate);
        let done = false;
        const finish = (error?: Error) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            subscription.remove();
            if (error) {
                releasePlayer(player);
                reject(error);
            } else {
                resolve(player);
            }
        };
        const timer = setTimeout(() => finish(new Error(`Audio load timed out: ${uri}`)), timeoutMs);
        const subscription = onStatus(player, status => {
            if (status.error) finish(new Error(`Audio load failed: ${uri} ${status.error}`));
            else if (isReady(status)) finish();
        });
        // Already loaded before the listener was attached (cached file)
        if (player.isLoaded && player.duration > 0) finish();
    });
