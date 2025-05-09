import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, inject, OnInit, ViewChild, viewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioTrack, Chapter, speed_array, SubtitleCue, VideoSource, VideoTrack } from '../models/video.model';
import { fadeInOut } from '../services/animations';
//import { VideoAudioSyncService } from '../services/video.service';
import { EventListenerService } from '../services/event-handler.service';
import { VideoAudioSyncDirective } from '../directives/video-audio-sync.directive';
import { ProgressTooltipDirective } from '../directives/progress-tooltip.directive';
import { TooltipComponent } from '../tooltip/tooltip.component';
declare const bootstrap: any;
@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  imports: [ProgressTooltipDirective, NgFor, FormsModule, NgClass, NgIf, VideoAudioSyncDirective],
  styleUrls: ['./video-player.component.scss', 'captions.scss'],
  animations: [fadeInOut],
})
export class VideoPlayerComponent implements OnInit {
  /*audioSync = inject(VideoAudioSyncService);*/
  eventListenerService = inject(EventListenerService);
  readonly videoPlayer = viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');
  get video(): HTMLVideoElement {
    return this.videoPlayer().nativeElement;
  }
  readonly ccToggleBtnRef = viewChild.required<ElementRef<HTMLDivElement>>('ccToggleBtn');
  private ccDropdownInstance: any;

  readonly progressRef = viewChild.required<ElementRef<HTMLDivElement>>('progressContainer');
  private ccProgressInstance: any;

  readonly speedToggleBtnRef = viewChild.required<ElementRef<HTMLDivElement>>('speedToggleBtn');
  private speedToggleInstance: any;

  readonly chapterBtnRef = viewChild.required<ElementRef<HTMLDivElement>>('chapterBtn');
  private chapterInstance: any;

  readonly thumbVideoRef = viewChild.required<ElementRef<HTMLVideoElement>>('thumbVideo');
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  /*service version*/
  readonly externalAudioRef = viewChild.required<ElementRef<HTMLVideoElement>>('externalAudio');

  /*directive version*/
  readonly syncDirective = viewChild(VideoAudioSyncDirective);

  @ViewChild('tooltipContainer', { read: ViewContainerRef })
  tooltipContainer!: ViewContainerRef;
  private tooltipRef: any;
  // Video Library
  videoLibrary: VideoSource[] = [
    {
      title: 'Return of the Condor Heroes',
      src: 'assets/videos/Return of the Condor Heroes.mp4',
      type: 'video/mp4',
      hasCaptions: false,
      audioTracks: [
        {
          src: 'assets/audio/sample1-en.mp3',
          kind: 'audio',
          srclang: 'en',
          label: 'English',
          default: true
        },
        {
          src: 'assets/audio/sample1-es.mp3',
          kind: 'audio',
          srclang: 'es',
          label: 'Spanish'
        }
      ],
      tracks: [
        {
          src: '',
          kind: 'subtitles',
          srclang: 'en',
          label: 'English',
          default: true
        }
      ]
    },
    {
      title: 'David Blaine',
      src: 'assets/videos/David Blaine.mp4',
      type: 'video/mp4',
      hasCaptions: true,
      audioTracks: [
        {
          src: 'assets/audio/sample1-en.mp3',
          kind: 'audio',
          srclang: 'en',
          label: 'English',
          default: true
        },
        {
          src: 'assets/audio/sample1-es.mp3',
          kind: 'audio',
          srclang: 'es',
          label: 'Spanish'
        }
      ],
      tracks: [
        {
          src: 'assets/subtitles/David Blaine-en.vtt',
          kind: 'subtitles',
          srclang: 'en',
          label: 'English',
          default: true
        },
        {
          src: 'assets/subtitles/David Blaine-km.vtt',
          kind: 'subtitles',
          srclang: 'km',
          label: 'Khmer'
        }
      ]
    }
 
  ];

  // Chapters for the current video
  chapters: Chapter[] = [
    { title: 'Introduction', time: 0 },
    { title: 'Main Content', time: 30 },
    { title: 'Conclusion', time: 120 }
  ];

  // Player state
  currentVideo: VideoSource = this.videoLibrary[0];
  selectedVideo: VideoSource = this.videoLibrary[0];
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
  constructor() {
    this.eventListenerService.registerKeyboardHandler(this.handleKeyboardEvent.bind(this));
  }
  ngOnInit(): void {
    this.loadVideo();
  }
  ngAfterViewInit() {
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
    //this.destroy$.next();
    //this.destroy$.complete();

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
  changeVideo(): void {
    this.resetCaptionState();
    this.currentVideo = this.selectedVideo;
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

  toggleFullscreen(): void {
    const videoContainer = this.videoPlayer().nativeElement.parentElement;

    if (!this.isFullscreen) {
      if (videoContainer?.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if ((videoContainer as any)?.webkitRequestFullscreen) {
        (videoContainer as any).webkitRequestFullscreen();
      } else if ((videoContainer as any)?.msRequestFullscreen) {
        (videoContainer as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }

    this.isFullscreen = !this.isFullscreen;
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
  get availableAudioTracks(): AudioTrack[] {
    return this.currentVideo?.audioTracks || [];
  }
  get hasMultipleAudioTracks(): boolean {
    return this.availableAudioTracks.length > 1;
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
    if (this.ccToggleBtnRef().nativeElement) {
      this.ccDropdownInstance = new bootstrap.Dropdown(this.ccToggleBtnRef().nativeElement);
    }

    if (this.progressRef().nativeElement) {
      this.ccProgressInstance = new bootstrap.Dropdown(this.progressRef().nativeElement);
    }

    if (this.speedToggleBtnRef().nativeElement) {
      this.speedToggleInstance = new bootstrap.Dropdown(this.speedToggleBtnRef().nativeElement);
    }

    if (this.chapterBtnRef().nativeElement) {
      this.chapterInstance = new bootstrap.Dropdown(this.chapterBtnRef().nativeElement);
    }
  }
}
