import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VideoAudioSyncService {
  http = inject(HttpClient); 
  private videoEl?: HTMLVideoElement;
  private audioEl?: HTMLAudioElement;

  private onSeek = () => this.syncAudioTime();
  private onPlay = () => this.audioEl?.play();
  private onPause = () => this.audioEl?.pause();

  init(video: HTMLVideoElement, audio: HTMLAudioElement): void {
    this.videoEl = video;
    this.audioEl = audio;

    this.attachListeners();
  }

  attachListeners(): void {
    if (!this.videoEl || !this.audioEl) return;

    this.videoEl.addEventListener('seeked', this.onSeek);
    this.videoEl.addEventListener('play', this.onPlay);
    this.videoEl.addEventListener('pause', this.onPause);
  }

  detachListeners(): void {
    if (!this.videoEl) return;

    this.videoEl.removeEventListener('seeked', this.onSeek);
    this.videoEl.removeEventListener('play', this.onPlay);
    this.videoEl.removeEventListener('pause', this.onPause);
  }

  async switchToExternalAudio(audioSrc: string): Promise<void> {
    if (!this.videoEl || !this.audioEl) return;

    this.detachListeners(); // Ensure no duplicate events

    // Mute the video audio
    this.videoEl.muted = true;

    // Load the new audio
    this.audioEl.src = audioSrc;
    await this.audioEl.load();

    // Sync currentTime
    this.audioEl.currentTime = this.videoEl.currentTime;

    // Resume if video is playing
    if (!this.videoEl.paused) {
      await this.audioEl.play();
    }

    this.attachListeners();
  }

  switchToVideoAudio(): void {
    if (!this.videoEl || !this.audioEl) return;

    this.detachListeners();
    this.audioEl.pause();
    this.audioEl.src = '';
    this.videoEl.muted = false;
  }

  private syncAudioTime(): void {
    if (!this.videoEl || !this.audioEl) return;
    this.audioEl.currentTime = this.videoEl.currentTime;
  }
  getVideo() {
    return this.http.get<any[]>('/assets/video_files.json');
  }
}
