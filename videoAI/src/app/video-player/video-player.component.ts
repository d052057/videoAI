import {  NgClass, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild, viewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioTrack, Chapter, speed_array, SubtitleCue, VideoSource, VideoTrack } from '../models/video.model';
import { fadeInOut } from '../services/animations';
import { VideoAudioSyncService } from '../services/video.service';
import { EventListenerService } from '../services/event-handler.service';
import { VideoAudioSyncDirective } from '../directives/video-audio-sync.directive';
import { ProgressTooltipDirective } from '../directives/progress-tooltip.directive';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { from, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { TimeConversionPipe } from '../directives/time-conversion.pipe';
import { VideoDurationDirective } from '../directives/video-duration.directive'
declare const bootstrap: any;
@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  imports: [ProgressTooltipDirective, NgFor, FormsModule, NgClass, NgIf, VideoAudioSyncDirective, TimeConversionPipe],
  styleUrls: ['./video-player.component.scss', 'captions.scss','chapter.scss'],
  animations: [fadeInOut],
})
export class VideoPlayerComponent implements OnInit {
  service = inject(VideoAudioSyncService);
  eventListenerService = inject(EventListenerService);
  readonly videoPlayer = viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');
  private readonly videoListContainer = viewChild.required<ElementRef>('videoListContainer');
  get video(): HTMLVideoElement {
    return this.videoPlayer().nativeElement;
  }
  readonly ccToggleBtnRef = viewChild<ElementRef<HTMLDivElement>>('ccToggleBtn');
  private ccDropdownInstance: any;

  readonly progressRef = viewChild.required<ElementRef<HTMLDivElement>>('progressContainer');
  private ccProgressInstance: any;

  readonly speedToggleBtnRef = viewChild.required<ElementRef<HTMLDivElement>>('speedToggleBtn');
  private speedToggleInstance: any;

  readonly chapterBtnRef = viewChild<ElementRef<HTMLDivElement>>('chapterBtn');
  private chapterInstance: any;

  readonly thumbVideoRef = viewChild.required<ElementRef<HTMLVideoElement>>('thumbVideo');
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  /*service version*/
  readonly externalAudioRef = viewChild<ElementRef<HTMLVideoElement>>('externalAudio');

  /*directive version*/
  readonly syncDirective = viewChild(VideoAudioSyncDirective);
  readonly figure = viewChild.required<ElementRef<HTMLElement>>('figure');
  @ViewChild('tooltipContainer', { read: ViewContainerRef })
  tooltipContainer!: ViewContainerRef;
  private tooltipRef: any;
  videoLibrary: VideoSource[] = [];
  currentVideo!: VideoSource;
  isPlaying = false;
  isMuted = false;
  volume = 0.5;
  currentTime = 0;
  duration = 0;
  isFullscreen = false;
  selectedCaptionLanguage: string = 'off';

  tooltipGlobalX = 0;
  tooltipGlobalY = 0;
  speed = speed_array;
  currentTrackIndex = signal(0);
  private destroy$ = new Subject<void>();
  constructor() {
    this.eventListenerService.registerKeyboardHandler(this.handleKeyboardEvent.bind(this));
  }
  ngOnInit(): void {
    this.service.getVideo()
      .pipe(
        takeUntil(this.destroy$),
        // Use switchMap to handle the async operation
        switchMap(async (data: any) => {
          // Here's your for loop with await
          const result: VideoSource[] = [];
          for (let v of data) {
            let captionflag = false;
            const dur = await this.getVideoDuration(v.url);
            const tracks = v.tracks || [];
            if (tracks.length > 0) {
              captionflag = true;
            }
            result.push({
              title: v.title,
              src: v.url,
              type: 'video/mp4',
              hasCaptions: captionflag,
              hasChapters: false,
              hasAudioTracks: false,
              duration: dur,
              tracks: tracks, // caption
              audioTracks: [] as AudioTrack[],
              chapters: [] as Chapter[]
            });
          }
          return result;
        }),
        // Convert the Promise result back to an Observable
        switchMap(result => of(result))
      )
      .subscribe((data: VideoSource[]) => {
        this.videoLibrary = data;
        this.currentVideo = this.videoLibrary[this.currentTrackIndex()];
      });
      /*this.loadVideo();*/
  }
  ngAfterViewInit() {
    if (this.currentVideo) {
      this.loadVideo();
    }
    this.bootstrapHouseKeeper();
    this.eventListenerService.registerHandler(this.video, 'timeupdate', this.onTimeUpdate);
    this.eventListenerService.registerHandler(this.video, 'loadedmetadata', this.onLoadedMetadata);
    this.eventListenerService.registerHandler(this.video, 'ended', this.onEnded);

    //this.audioSync.init(
    //  this.videoPlayer().nativeElement,
    //  this.externalAudioRef().nativeElement
    //);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.videoPlayer()) {
      this.eventListenerService.unregisterAll();
    }
  }
  loadVideo(): void {
    this.videoPlayer().nativeElement.load();
    this.thumbVideoRef().nativeElement.load();
    this.videoPlayer().nativeElement.volume = this.volume;
    this.videoPlayer().nativeElement.playbackRate = 1;

    // Enable captions if available
    if (this.currentVideo.tracks && this.currentVideo.tracks.length > 0) {
      const defaultTrack = this.currentVideo.tracks.find(t => t.default);
      if (defaultTrack) {
        this.enableCaptions(defaultTrack.srclang);
      }
    }
  }
  onTimeUpdate = (): void => {
    this.currentTime = this.videoPlayer().nativeElement.currentTime;
  }
  onLoadedMetadata = (): void => {
    this.duration = this.videoPlayer().nativeElement.duration;
  }

  onEnded = (): void => {
    // handle video ended
  }

  // Add to your changeVideo() method
  playVideo(index: number): void {
    this.resetCaptionState();
    this.currentTrackIndex.set(index);
    this.currentVideo = this.videoLibrary[this.currentTrackIndex()];
    this.loadVideo();
  }


  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    this.videoPlayer().nativeElement.play()
      .then(() => this.isPlaying = true)
      .catch(error => console.error('Error playing video:', error));
  }

  pause(): void {
    this.videoPlayer().nativeElement.pause();
    this.isPlaying = false;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.videoPlayer().nativeElement.muted = this.isMuted;
  }

  setVolume(): void {
    this.videoPlayer().nativeElement.volume = this.volume;
    this.isMuted = this.volume === 0;
  }

  setPlaybackRate(speed: number): void {
    this.videoPlayer().nativeElement.playbackRate = speed;
  }

  seek(event: MouseEvent): void {
    const rect = this.progressRef().nativeElement.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    this.videoPlayer().nativeElement.currentTime = pos * this.videoPlayer().nativeElement.duration;
    this.currentTime = this.videoPlayer().nativeElement.currentTime;
  }

  toggleCaptions(lang: string, event?: Event): void {
    if (!this.video || !this.video.textTracks) return;

    for (let i = 0; i < this.video.textTracks.length; i++) {
      const track = this.video.textTracks[i];
      track.mode = (track.language === lang && lang !== 'off') ? 'showing' : 'disabled';
    }

    // Auto-close dropdown via instance
    this.ccDropdownInstance?.hide();
  }

  enableCaptions(lang: string): void {
    for (let i = 0; i < this.video.textTracks.length; i++) {
      const track = this.video.textTracks[i];
      track.mode = track.language === lang ? 'showing' : 'hidden';
    }
  }

  disableCaptions(): void {
    for (let i = 0; i < this.video.textTracks.length; i++) {
      this.video.textTracks[i].mode = 'hidden';
    }
  }

  jumpToChapter(time: number): void {
    if (!isNaN(time)) {
      this.videoPlayer().nativeElement.currentTime = time;
      this.play();
    }
  }

  //async toggleFullscreen(): Promise<void> {
  //  if (document.fullscreenElement) {
  //    this.isFullscreen = false;
  //    document.exitFullscreen();
  //  } else {
  //    this.isFullscreen = true;
  //    this.figure().nativeElement.requestFullscreen();
  //  }
  //}
  async toggleFullscreen(): Promise<void> {
    const container = this.videoPlayer().nativeElement.closest('.video-container');

    try {
      if (!this.isFullscreen) {
        await (container?.requestFullscreen?.() ||
          (container as any)?.webkitRequestFullscreen?.() ||
          (container as any)?.msRequestFullscreen?.());
      } else {
        await (document.exitFullscreen?.() ||
          (document as any)?.webkitExitFullscreen?.() ||
          (document as any)?.msExitFullscreen?.());
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    } finally {
      this.isFullscreen = !this.isFullscreen;
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Update current time and duration
  //onTimeUpdate(): void {
  //  this.currentTime = this.videoPlayer().nativeElement.currentTime;
  //  this.duration = this.videoPlayer().nativeElement.duration || 0;
  //}

  // Handle keyboard shortcuts
  /*@HostListener('window:keydown', ['$event'])*/
  handleKeyboardEvent(event: KeyboardEvent): void {

    switch (event.key) {
      case ' ':
        event.preventDefault();
        this.togglePlay();
        break;
      case 'm':
        this.toggleMute();
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
      case 'ArrowLeft':
        this.video.currentTime = Math.max(0, this.video.currentTime - 5);
        break;
      case 'ArrowRight':
        this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 5);
        break;
      case 'ArrowUp':
        this.volume = Math.min(1, this.volume + 0.1);
        this.setVolume();
        break;
      case 'ArrowDown':
        this.volume = Math.max(0, this.volume - 0.1);
        this.setVolume();
        break;
    }
  }
  /*service version*/
  //async changeAudioLanguage(lang: string): Promise<void> {
  //  const audioTrack = this.currentVideo.audioTracks?.find(a => a.srclang === lang);

  //  if (audioTrack) {
  //    await this.audioSync.switchToExternalAudio(audioTrack.src);
  //  } else {
  //    this.audioSync.switchToVideoAudio();
  //  }
  //}
  /*directive version*/
  async changeAudioLanguage(lang: string) {
    const audioTrack = this.currentVideo.audioTracks?.find(a => a.srclang === lang);
    const sync = this.syncDirective();
    if (sync) {
      if (audioTrack) {
        await sync.switchToExternalAudio(audioTrack.src);
      } else {
        sync.switchToVideoAudio();
      }
    }
  }

  // Call this when changing videos
  resetCaptionState(): void {
    this.selectedCaptionLanguage = 'off';
    if (this.video.textTracks) {
      Array.from(this.video.textTracks).forEach(track => {
        track.mode = 'hidden';
      });
    }
  }
  get availableCaptionTracks(): VideoTrack[] {
    return this.currentVideo.tracks?.filter(t =>
      t.kind === 'subtitles' || t.kind === 'captions'
    ) || [];
  }

  get hasCaptions(): boolean {
    // Check both the explicit flag and actual tracks
    return this.currentVideo.hasCaptions ?? this.availableCaptionTracks.length > 0;
  }

  get activeCaptionLanguage(): string | null {
    for (let i = 0; i < this.video.textTracks.length; i++) {
      if (this.video.textTracks[i].mode === 'showing') {
        return this.video.textTracks[i].language;
      }
    }
    return null;
  }
  showTooltip(x: number, y: number, timeDisplay: string) {
    this.tooltipContainer.clear(); // Remove previous one
    this.tooltipRef = this.tooltipContainer.createComponent(TooltipComponent);
    this.tooltipRef.setInput('x', x);
    this.tooltipRef.setInput('y', y);
    this.tooltipRef.setInput('timeDisplay', timeDisplay);
  }

  hideTooltip() {
    this.tooltipContainer.clear();
  }
  bootstrapHouseKeeper() {
    if (this.ccToggleBtnRef()?.nativeElement) {
      this.ccDropdownInstance = new bootstrap.Dropdown(this.ccToggleBtnRef()?.nativeElement);
    }

    if (this.progressRef().nativeElement) {
      this.ccProgressInstance = new bootstrap.Dropdown(this.progressRef().nativeElement);
    }

    if (this.speedToggleBtnRef().nativeElement) {
      this.speedToggleInstance = new bootstrap.Dropdown(this.speedToggleBtnRef().nativeElement);
    }

    if (this.chapterBtnRef()?.nativeElement) {
      this.chapterInstance = new bootstrap.Dropdown(this.chapterBtnRef()?.nativeElement);
    }
  }
  scrollToCurrentTrack() {
    const container = this.videoListContainer().nativeElement;
    const selectedTrack = container.children[this.currentTrackIndex()];
    if (selectedTrack) {
      selectedTrack.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
 
  private getVideoDuration(src: string): Promise<number> {
    const video = document.createElement('video');

    return new Promise<number>((resolve, reject) => {
      // Add error handling
      const onError = () => {
        video.removeEventListener('loadedmetadata', onMetadata);
        reject(new Error(`Failed to load video metadata for ${src}`));
      };

      const onMetadata = () => {
        // Clean up event listeners
        video.removeEventListener('error', onError);
        resolve(Math.floor(video.duration));
      };

      video.addEventListener('loadedmetadata', onMetadata);
      video.addEventListener('error', onError);

      // Set properties that might help with loading
      video.preload = 'metadata';
      video.src = src;
    });
  }

  goToNextChapter(): void {
    const chapters = this.currentVideo.chapters || [];  
    const currentIndex = chapters.findIndex((chapter, i) =>
      this.currentTime >= chapter.time &&
      (i === chapters.length - 1 || this.currentTime < chapters[i + 1].time)
    );

    if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
      this.jumpToChapter(chapters[currentIndex + 1].time);
    }
  }

  goToPreviousChapter(): void {
    const chapters = this.currentVideo.chapters || [];
    const currentIndex = chapters.findIndex((chapter, i) =>
      this.currentTime >= chapter.time &&
      (i === chapters.length - 1 || this.currentTime < chapters[i + 1].time)
    );

    if (currentIndex > 0) {
      const chapters = this.currentVideo.chapters || [];
      // Optional: if user is within first few seconds of chapter, go to previous chapter
      const currentChapterStart = chapters[currentIndex].time;
      if (this.currentTime - currentChapterStart < 5 && currentIndex > 0) {
        this.jumpToChapter(chapters[currentIndex - 1].time);
      } else {
        // Otherwise, restart the current chapter
        this.jumpToChapter(chapters[currentIndex].time);
      }
    } else if (currentIndex === 0) {
      this.jumpToChapter(chapters[0].time);
    }
  }

}
