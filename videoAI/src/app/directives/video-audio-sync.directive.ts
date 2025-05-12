import { Directive, ElementRef, Input, OnDestroy, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[videoAudioSync]'
})
export class VideoAudioSyncDirective implements AfterViewInit, OnDestroy {
  @Input('videoAudioSync') videoEl!: HTMLVideoElement;

  private readonly audioEl: HTMLAudioElement;

  constructor(private host: ElementRef<HTMLAudioElement>) {
    this.audioEl = host.nativeElement;
  }

  ngAfterViewInit(): void {
    if (!this.videoEl) return;
    this.attachListeners();
  }

  private onSeek = () => this.syncTime();
  private onPlay = () => this.audioEl.play();
  private onPause = () => this.audioEl.pause();

  private attachListeners(): void {
    this.videoEl.addEventListener('seeked', this.onSeek);
    this.videoEl.addEventListener('play', this.onPlay);
    this.videoEl.addEventListener('pause', this.onPause);
  }

  private detachListeners(): void {
    this.videoEl.removeEventListener('seeked', this.onSeek);
    this.videoEl.removeEventListener('play', this.onPlay);
    this.videoEl.removeEventListener('pause', this.onPause);
  }

  private syncTime(): void {
    this.audioEl.currentTime = this.videoEl.currentTime;
  }

  async switchToExternalAudio(src: string): Promise<void> {
    this.videoEl.muted = true;
    this.audioEl.src = src;
    this.audioEl.load();
    this.audioEl.currentTime = this.videoEl.currentTime;
    if (!this.videoEl.paused) {
      await this.audioEl.play();
    }
  }

  switchToVideoAudio(): void {
    this.detachListeners();
    this.audioEl.pause();
    this.audioEl.src = '';
    this.videoEl.muted = false;
  }

  ngOnDestroy(): void {
    this.detachListeners();
  }
}
