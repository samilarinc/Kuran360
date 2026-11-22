import type { AudioPlayer, AudioStatus } from 'expo-audio';

/*
 * Web version of audioPlayer.ts on a plain HTML audio element. expo-audio's web player reports neither
 * the end of a file nor load errors, and waits for `loadeddata`, which some browsers only fire once
 * playback starts. The browser's media controls (Media Session API) get previous/next verse buttons.
 */

export type { AudioPlayer, AudioStatus };
export type PlayerStatus = AudioStatus & { error?: string };
export type LockScreenCommand = 'previous' | 'next';

type Listener = (payload: any) => void;

const ARTWORK_URL = '/favicon.png';

let lockScreenPlayer: WebPlayer | null = null;

class WebPlayer {
    readonly media: HTMLAudioElement;
    private listeners = new Map<string, Set<Listener>>();
    private timer: ReturnType<typeof setInterval> | null = null;
    private loaded = false;
    private ended = false;

    constructor(uri: string, private readonly updateIntervalMs: number) {
        const media = new Audio();
        media.preload = 'auto';
        media.preservesPitch = true;
        this.media = media;
        media.addEventListener('canplay', () => {
            if (this.loaded) return;
            this.loaded = true;
            this.emitStatus();
        });
        media.addEventListener('play', () => {
            this.ended = false;
            this.startTicking();
            this.emitStatus();
            this.syncMediaSession();
        });
        media.addEventListener('pause', () => {
            this.stopTicking();
            if (!media.ended) this.emitStatus();
            this.syncMediaSession();
        });
        media.addEventListener('seeked', () => this.emitStatus());
        media.addEventListener('ended', () => {
            this.stopTicking();
            this.ended = true;
            this.emitStatus();
        });
        media.addEventListener('error', () => {
            this.stopTicking();
            this.emitStatus({ error: media.error?.message || `media error ${media.error?.code ?? ''}`.trim() });
        });
        media.src = uri;
        media.load();
    }

    get currentTime() { return this.media.currentTime; }
    get duration() { return Number.isFinite(this.media.duration) ? this.media.duration : 0; }
    get isLoaded() { return this.loaded; }
    get playing() { return !this.media.paused && !this.media.ended; }
    get playbackRate() { return this.media.playbackRate; }

    set shouldCorrectPitch(value: boolean) { this.media.preservesPitch = value; }
    get shouldCorrectPitch() { return this.media.preservesPitch; }

    play() {
        this.media.play().catch(error => {
            // Autoplay refused (no user gesture yet) counts as a pause, not a broken file
            if (error?.name !== 'NotAllowedError' && error?.name !== 'AbortError') {
                this.emitStatus({ error: String(error?.message ?? error) });
            } else {
                this.emitStatus();
            }
        });
    }

    pause() { this.media.pause(); }

    async seekTo(seconds: number) {
        this.ended = false;
        this.media.currentTime = Math.max(0, seconds);
    }

    setPlaybackRate(rate: number) { this.media.playbackRate = rate; }

    addListener(event: string, listener: Listener) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(listener);
        return { remove: () => { this.listeners.get(event)?.delete(listener); } };
    }

    emit(event: string, payload: unknown) {
        this.listeners.get(event)?.forEach(listener => listener(payload));
    }

    setActiveForLockScreen(active: boolean, metadata?: { title?: string; artist?: string; artworkUrl?: string }) {
        const session = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
        if (!session) return;
        if (!active) {
            this.clearLockScreenControls();
            return;
        }
        lockScreenPlayer = this;
        session.metadata = new MediaMetadata({
            title: metadata?.title ?? '',
            artist: metadata?.artist ?? '',
            artwork: metadata?.artworkUrl ? [{ src: metadata.artworkUrl }] : [],
        });
        const command = (name: LockScreenCommand) => () => lockScreenPlayer?.emit('lockScreenCommand', { command: name });
        session.setActionHandler('play', () => lockScreenPlayer?.play());
        session.setActionHandler('pause', () => lockScreenPlayer?.pause());
        session.setActionHandler('previoustrack', command('previous'));
        session.setActionHandler('nexttrack', command('next'));
        this.syncMediaSession();
    }

    clearLockScreenControls() {
        const session = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
        if (!session || lockScreenPlayer !== this) return;
        lockScreenPlayer = null;
        session.metadata = null;
        session.playbackState = 'none';
        (['play', 'pause', 'previoustrack', 'nexttrack'] as MediaSessionAction[]).forEach(action => {
            try { session.setActionHandler(action, null); } catch { }
        });
    }

    remove() {
        this.stopTicking();
        this.clearLockScreenControls();
        this.listeners.clear();
        this.media.pause();
        this.media.removeAttribute('src');
        this.media.load();
    }

    private syncMediaSession() {
        if (lockScreenPlayer !== this || typeof navigator === 'undefined' || !navigator.mediaSession) return;
        navigator.mediaSession.playbackState = this.playing ? 'playing' : 'paused';
    }

    private startTicking() {
        this.stopTicking();
        this.timer = setInterval(() => this.emitStatus(), this.updateIntervalMs);
    }

    private stopTicking() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    private emitStatus(extra?: Partial<PlayerStatus>) {
        const status: PlayerStatus = {
            id: 0,
            currentTime: this.currentTime,
            playbackState: '',
            timeControlStatus: this.playing ? 'playing' : 'paused',
            reasonForWaitingToPlay: '',
            mute: this.media.muted,
            duration: this.duration,
            playing: this.playing,
            loop: this.media.loop,
            didJustFinish: this.ended,
            isBuffering: false,
            isLoaded: this.loaded,
            playbackRate: this.media.playbackRate,
            shouldCorrectPitch: this.media.preservesPitch,
            ...extra,
        };
        this.emit('playbackStatusUpdate', status);
    }
}

const asPlayer = (player: WebPlayer) => player as unknown as AudioPlayer;
const asWeb = (player: AudioPlayer) => player as unknown as WebPlayer;

export const showOnLockScreen = (player: AudioPlayer, title: string, artist?: string) => {
    asWeb(player).setActiveForLockScreen(true, { title, artist, artworkUrl: ARTWORK_URL });
};

export const onLockScreenCommand = (player: AudioPlayer, handler: (command: LockScreenCommand) => void) =>
    asWeb(player).addListener('lockScreenCommand', (payload: { command: LockScreenCommand }) => handler(payload.command));

export const onStatus = (player: AudioPlayer, handler: (status: PlayerStatus) => void) =>
    asWeb(player).addListener('playbackStatusUpdate', handler);

export const releasePlayer = (player: AudioPlayer | null | undefined) => {
    if (!player) return;
    try { asWeb(player).remove(); } catch { }
};

export const createPlayer = (uri: string) => asPlayer(new WebPlayer(uri, 250));

export const loadPlayer = (uri: string, { timeoutMs, updateIntervalMs, rate }: { timeoutMs: number; updateIntervalMs: number; rate?: number }) =>
    new Promise<AudioPlayer>((resolve, reject) => {
        const web = new WebPlayer(uri, updateIntervalMs);
        if (rate && rate !== 1) web.setPlaybackRate(rate);
        let done = false;
        const finish = (error?: Error) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            subscription.remove();
            if (error) {
                web.remove();
                reject(error);
            } else {
                resolve(asPlayer(web));
            }
        };
        const timer = setTimeout(() => finish(new Error(`Audio load timed out: ${uri}`)), timeoutMs);
        const subscription = web.addListener('playbackStatusUpdate', (status: PlayerStatus) => {
            if (status.error) finish(new Error(`Audio load failed: ${uri} ${status.error}`));
            else if (status.isLoaded) finish();
        });
    });
