interface YTPlayer {
  loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface YTPlayerState {
  readonly OFF: -1;
  readonly UNSTARTED: -1;
  readonly PLAYING: 1;
  readonly PAUSED: 2;
  readonly BUFFERING: 3;
  readonly CUED: 5;
}

declare global {
  interface Window {
    YT?: {
      Player: new (id: string, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: YTPlayerState;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export {};
