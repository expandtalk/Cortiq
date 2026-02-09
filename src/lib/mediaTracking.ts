/**
 * Media Tracking Library
 * Task #22: Media Analytics
 *
 * Client-side utility for tracking media events (video, audio, documents)
 */

import type { MediaEvent, MediaMetadata, MediaType } from '@/types/media';

interface MediaTrackerConfig {
  siteId: string;
  sessionId?: string;
  visitorHash?: string;
}

export class MediaTracker {
  private siteId: string;
  private sessionId?: string;
  private visitorHash?: string;
  private mediaId: string;
  private mediaType: MediaType;
  private metadata?: MediaMetadata;
  private lastProgressReport = 0;
  private progressInterval = 5000; // Report progress every 5 seconds
  private progressThreshold = 5; // Report if progress changed by 5%

  constructor(
    mediaId: string,
    mediaType: MediaType,
    config: MediaTrackerConfig,
    metadata?: MediaMetadata
  ) {
    this.mediaId = mediaId;
    this.mediaType = mediaType;
    this.siteId = config.siteId;
    this.sessionId = config.sessionId;
    this.visitorHash = config.visitorHash;
    this.metadata = metadata;
  }

  /**
   * Track a media event
   */
  async trackEvent(event: Omit<MediaEvent, 'media_id' | 'media_type'>): Promise<boolean> {
    try {
      const payload: MediaEvent = {
        ...event,
        media_id: this.mediaId,
        media_type: this.mediaType,
      };

      const response = await fetch('/api/media-analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: this.siteId,
          session_id: this.sessionId,
          visitor_hash: this.visitorHash,
          event: payload,
          metadata: this.metadata,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error tracking media event:', error);
      return false;
    }
  }

  /**
   * Track play event
   */
  async trackPlay(currentTime: number = 0, duration?: number): Promise<boolean> {
    return this.trackEvent({
      event_type: 'play',
      current_time: currentTime,
      duration,
    });
  }

  /**
   * Track pause event
   */
  async trackPause(currentTime: number, duration?: number): Promise<boolean> {
    return this.trackEvent({
      event_type: 'pause',
      current_time: currentTime,
      duration,
    });
  }

  /**
   * Track resume event
   */
  async trackResume(currentTime: number, duration?: number): Promise<boolean> {
    return this.trackEvent({
      event_type: 'resume',
      current_time: currentTime,
      duration,
    });
  }

  /**
   * Track seek event
   */
  async trackSeek(
    currentTime: number,
    targetTime: number,
    duration?: number
  ): Promise<boolean> {
    return this.trackEvent({
      event_type: 'seek',
      current_time: currentTime,
      target_time: targetTime,
      duration,
    });
  }

  /**
   * Track progress/heartbeat event
   */
  async trackProgress(currentTime: number, duration?: number): Promise<boolean> {
    return this.trackEvent({
      event_type: 'progress',
      current_time: currentTime,
      duration,
    });
  }

  /**
   * Track completion event
   */
  async trackComplete(duration?: number): Promise<boolean> {
    return this.trackEvent({
      event_type: 'complete',
      current_time: duration,
      duration,
    });
  }

  /**
   * Track quality change
   */
  async trackQualityChange(quality: string, currentTime?: number): Promise<boolean> {
    return this.trackEvent({
      event_type: 'quality_change',
      quality,
      current_time: currentTime,
    });
  }

  /**
   * Track fullscreen toggle
   */
  async trackFullscreenChange(isFullscreen: boolean, currentTime?: number): Promise<boolean> {
    return this.trackEvent({
      event_type: 'fullscreen',
      is_fullscreen: isFullscreen,
      current_time: currentTime,
    });
  }

  /**
   * Track error
   */
  async trackError(
    errorCode: string,
    errorMessage: string,
    currentTime?: number
  ): Promise<boolean> {
    return this.trackEvent({
      event_type: 'error',
      error_code: errorCode,
      error_message: errorMessage,
      current_time: currentTime,
    });
  }

  /**
   * Track buffering
   */
  async trackBuffering(bufferingDuration: number, currentTime?: number): Promise<boolean> {
    return this.trackEvent({
      event_type: 'progress',
      buffering_duration: bufferingDuration,
      current_time: currentTime,
    });
  }

  /**
   * Attach to HTML5 video element
   */
  attachToVideoElement(videoElement: HTMLVideoElement): void {
    let isPlaying = false;
    let lastProgressTime = 0;

    // Play event
    videoElement.addEventListener('play', () => {
      isPlaying = true;
      this.trackPlay(videoElement.currentTime, videoElement.duration);
    });

    // Pause event
    videoElement.addEventListener('pause', () => {
      isPlaying = false;
      this.trackPause(videoElement.currentTime, videoElement.duration);
    });

    // Seek event
    let isSeeking = false;
    videoElement.addEventListener('seeking', () => {
      isSeeking = true;
    });

    videoElement.addEventListener('seeked', () => {
      if (isSeeking) {
        this.trackSeek(
          videoElement.currentTime,
          videoElement.currentTime,
          videoElement.duration
        );
        isSeeking = false;
      }
    });

    // Progress tracking
    videoElement.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastProgressTime > this.progressInterval && isPlaying) {
        this.trackProgress(videoElement.currentTime, videoElement.duration);
        lastProgressTime = now;
      }
    });

    // Completion
    videoElement.addEventListener('ended', () => {
      this.trackComplete(videoElement.duration);
      isPlaying = false;
    });

    // Error handling
    videoElement.addEventListener('error', () => {
      const error = videoElement.error;
      this.trackError(
        error?.code.toString() || 'unknown',
        error?.message || 'Unknown error',
        videoElement.currentTime
      );
    });

    // Volume change (mute/unmute)
    videoElement.addEventListener('volumechange', () => {
      if (videoElement.muted) {
        this.trackEvent({
          event_type: 'progress',
          is_muted: true,
          current_time: videoElement.currentTime,
          volume: 0,
        });
      }
    });

    // Fullscreen change
    document.addEventListener('fullscreenchange', () => {
      this.trackFullscreenChange(
        !!document.fullscreenElement,
        videoElement.currentTime
      );
    });
  }

  /**
   * Attach to HTML5 audio element
   */
  attachToAudioElement(audioElement: HTMLAudioElement): void {
    let isPlaying = false;
    let lastProgressTime = 0;

    // Play event
    audioElement.addEventListener('play', () => {
      isPlaying = true;
      this.trackPlay(audioElement.currentTime, audioElement.duration);
    });

    // Pause event
    audioElement.addEventListener('pause', () => {
      isPlaying = false;
      this.trackPause(audioElement.currentTime, audioElement.duration);
    });

    // Progress tracking
    audioElement.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastProgressTime > this.progressInterval && isPlaying) {
        this.trackProgress(audioElement.currentTime, audioElement.duration);
        lastProgressTime = now;
      }
    });

    // Completion
    audioElement.addEventListener('ended', () => {
      this.trackComplete(audioElement.duration);
      isPlaying = false;
    });

    // Error handling
    audioElement.addEventListener('error', () => {
      const error = audioElement.error;
      this.trackError(
        error?.code.toString() || 'unknown',
        error?.message || 'Unknown error',
        audioElement.currentTime
      );
    });
  }

  /**
   * Set progress report interval (in milliseconds)
   */
  setProgressInterval(ms: number): void {
    this.progressInterval = ms;
  }

  /**
   * Set progress threshold (minimum percentage change to report)
   */
  setProgressThreshold(percentage: number): void {
    this.progressThreshold = percentage;
  }
}

/**
 * Helper function to get device and browser information
 */
export function getDeviceInfo(): {
  device_type: string;
  browser: string;
  os: string;
} {
  const userAgent = navigator.userAgent;

  // Detect device type
  let device_type = 'desktop';
  if (/mobile/i.test(userAgent)) device_type = 'mobile';
  else if (/tablet|ipad/i.test(userAgent)) device_type = 'tablet';

  // Detect browser
  let browser = 'unknown';
  if (/chrome/i.test(userAgent)) browser = 'chrome';
  else if (/safari/i.test(userAgent)) browser = 'safari';
  else if (/firefox/i.test(userAgent)) browser = 'firefox';
  else if (/edge/i.test(userAgent)) browser = 'edge';

  // Detect OS
  let os = 'unknown';
  if (/windows/i.test(userAgent)) os = 'windows';
  else if (/mac/i.test(userAgent)) os = 'macos';
  else if (/linux/i.test(userAgent)) os = 'linux';
  else if (/android/i.test(userAgent)) os = 'android';
  else if (/iphone|ipad/i.test(userAgent)) os = 'ios';

  return { device_type, browser, os };
}

/**
 * Helper to calculate watch time percentage
 */
export function calculateWatchPercentage(current: number, duration: number): number {
  if (duration === 0) return 0;
  return Math.round((current / duration) * 100);
}

/**
 * Helper to format time in HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hrs > 0) parts.push(hrs.toString().padStart(2, '0'));
  parts.push(mins.toString().padStart(2, '0'));
  parts.push(secs.toString().padStart(2, '0'));

  return parts.join(':');
}

/**
 * Helper to get video quality from resolution
 */
export function getQualityLabel(width: number, height: number): string {
  if (height >= 2160) return '4K';
  if (height >= 1440) return '1440p';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  return '360p';
}
