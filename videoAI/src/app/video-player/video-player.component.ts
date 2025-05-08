import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioTrack, Chapter, speed_array, SubtitleCue, VideoSource, VideoTrack } from '../models/video.model';
declare const bootstrap: any;
@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  imports: [NgFor, FormsModule, NgClass, NgIf],
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {
  readonly videoPlayer = viewChild.required<ElementRef<HTMLVideoElement>>('videoPlayer');

  readonly ccToggleBtnRef = viewChild.required<ElementRef<HTMLDivElement>>('ccToggleBtn');
  private ccDropdownInstance: any;

  readonly progressRef = viewChild.required<ElementRef<HTMLDivElement>>('progressContainer');
  private ccProgressInstance: any;

  readonly speedToggleBtnRef = viewChild.required<ElementRef<HTMLDivElement>>('speedToggleBtn');
  private speedToggleInstance: any;

  readonly chapterBtnRef = viewChild.required<ElementRef<HTMLDivElement>>('chapterBtn');
  private chapterInstance: any;

  // Video Library
  videoLibrary: VideoSource[] = [
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
          src: 'assets/subtitlesDavid Blaine-km.vtt',
          kind: 'subtitles',
          srclang: 'km',
          label: 'Khmer'
        }
      ]
    },
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

  showHoverTime = false;
  tooltipGlobalX = 0;
  tooltipGlobalY = 0;
  hoverTimeDisplay = '';
  speed = speed_array;
  ngOnInit(): void {
    this.loadVideo();
  }
  ngAfterViewInit() {
    this.videoPlayer().nativeElement.addEventListener('timeupdate', () => {
      this.currentTime = this.videoPlayer().nativeElement.currentTime;
    });

    this.videoPlayer().nativeElement.addEventListener('loadedmetadata', () => {
      this.duration = this.videoPlayer().nativeElement.duration;
    });

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
    this.setupTextTracks();
  }
  loadVideo(): void {
    const video = this.videoPlayer().nativeElement;
    video.load();
    video.volume = this.volume;
    video.playbackRate = 1;

    // Enable captions if available
    if (this.currentVideo.tracks && this.currentVideo.tracks.length > 0) {
      const defaultTrack = this.currentVideo.tracks.find(t => t.default);
      if (defaultTrack) {
        this.enableCaptions(defaultTrack.srclang);
      }
    }
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
  }

  toggleCaptions(lang: string, event?: Event): void {
    const video: HTMLVideoElement | null = document.querySelector('video');
    if (!video || !video.textTracks) return;

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      track.mode = (track.language === lang && lang !== 'off') ? 'showing' : 'disabled';
    }

    // Auto-close dropdown via instance
    this.ccDropdownInstance?.hide();
  }

  enableCaptions(lang: string): void {
    const video = this.videoPlayer().nativeElement;
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      track.mode = track.language === lang ? 'showing' : 'hidden';
    }
  }

  disableCaptions(): void {
    const video = this.videoPlayer().nativeElement;
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = 'hidden';
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
  onTimeUpdate(): void {
    this.currentTime = this.videoPlayer().nativeElement.currentTime;
    this.duration = this.videoPlayer().nativeElement.duration || 0;
  }

  // Handle keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const video = this.videoPlayer().nativeElement;

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
        video.currentTime = Math.max(0, video.currentTime - 5);
        break;
      case 'ArrowRight':
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
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
  async changeAudioLanguage(lang:string): Promise<void> {

    const currentTime = this.videoPlayer().nativeElement.currentTime;
    const isPlaying = !this.videoPlayer().nativeElement.paused;

    // Find the audio track
    const audioTrack = this.currentVideo.audioTracks?.find(a => a.srclang === lang);
    if (!audioTrack) return;

    // Pause video
    this.pause();

    // Change source (this requires separate audio files)
    this.videoPlayer().nativeElement.src = audioTrack.src;

    // Wait for the new source to load
    await new Promise(resolve => {
      this.videoPlayer().nativeElement.addEventListener('loadedmetadata', resolve, { once: true });
    });

    // Restore playback position
    this.videoPlayer().nativeElement.currentTime = currentTime;

    // Resume playback if it was playing
    if (isPlaying) {
      this.play();
    }
  }
  get availableAudioTracks(): AudioTrack[] {
    return this.currentVideo?.audioTracks || [];
  }
  get hasMultipleAudioTracks(): boolean {
    return this.availableAudioTracks.length > 1;
  }
  private setupTextTracks(): void {
    const video = this.videoPlayer().nativeElement;

    // Wait for tracks to load
    video.addEventListener('loadedmetadata', () => {
      // Set default caption if specified
      const defaultTrack = this.availableCaptionTracks.find(t => t.default);
      if (defaultTrack) {
        this.selectedCaptionLanguage = defaultTrack.srclang;
        /*this.changeCaptionLanguage();*/
      }

      // Handle track errors
      Array.from(video.textTracks).forEach(track => {
        track.addEventListener('error', () => {
          console.warn(`Caption track failed: ${track.label}`);
          if (this.selectedCaptionLanguage === track.language) {
            this.selectedCaptionLanguage = 'off';
          }
        });
      });
    });
  }

  // Call this when changing videos
  resetCaptionState(): void {
    this.selectedCaptionLanguage = 'off';
    const video = this.videoPlayer().nativeElement;
    if (video.textTracks) {
      Array.from(video.textTracks).forEach(track => {
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
    const video = this.videoPlayer().nativeElement;
    for (let i = 0; i < video.textTracks.length; i++) {
      if (video.textTracks[i].mode === 'showing') {
        return video.textTracks[i].language;
      }
    }
    return null;
  }
  // In your component.ts
  setCaption(lang: string) {
    const video: HTMLVideoElement | null = document.querySelector('video');
    if (!video || !video.textTracks) return;

    // Enable selected track or disable all
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      track.mode = (track.language === lang && lang !== 'off') ? 'showing' : 'disabled';
    }

    // 🔽 Auto-close the dropdown
    const dropdownElement = document.querySelector('.dropdown-toggle');
    if (dropdownElement) {
      const dropdown = bootstrap.Dropdown.getInstance(dropdownElement)
        || new bootstrap.Dropdown(dropdownElement);
      dropdown.hide();
    }
  }
  showTooltip(event: MouseEvent): void {
    const rect = this.progressRef().nativeElement.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    const hoverTime = pos * this.duration;

    this.tooltipGlobalX = event.clientX;
    this.tooltipGlobalY = event.clientY - 30; // 30px above the cursor
    this.hoverTimeDisplay = this.formatTime(hoverTime);
    this.showHoverTime = true;
  }

  hideTooltip(): void {
    this.showHoverTime = false;
  }

}
