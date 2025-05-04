import { NgClass, NgFor } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
interface VideoTrack {
  src: string;
  kind: string;
  srclang: string;
  label: string;
  default?: boolean;
}

interface VideoSource {
  src: string;
  type: string;
  title: string;
  tracks?: VideoTrack[];
}

interface Chapter {
  title: string;
  time: number;
}

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  imports: [NgFor, FormsModule, NgClass],
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  // Video Library
  videoLibrary: VideoSource[] = [
    {
      title: 'Sample Video 1',
      src: 'assets/videos/sample1.mp4',
      type: 'video/mp4',
      tracks: [
        {
          src: 'assets/subtitles/sample1-en.vtt',
          kind: 'subtitles',
          srclang: 'en',
          label: 'English',
          default: true
        },
        {
          src: 'assets/subtitles/sample1-es.vtt',
          kind: 'subtitles',
          srclang: 'es',
          label: 'Spanish'
        }
      ]
    },
    {
      title: 'Sample Video 2',
      src: 'assets/videos/sample2.mp4',
      type: 'video/mp4',
      tracks: [
        {
          src: 'assets/subtitles/sample2-en.vtt',
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
  volume = 1;
  playbackRate = 1;
  currentTime = 0;
  duration = 0;
  isFullscreen = false;

  ngOnInit(): void {
    this.loadVideo();
  }

  loadVideo(): void {
    const video = this.videoPlayer.nativeElement;
    video.load();
    video.volume = this.volume;
    video.playbackRate = this.playbackRate;

    // Enable captions if available
    if (this.currentVideo.tracks && this.currentVideo.tracks.length > 0) {
      const defaultTrack = this.currentVideo.tracks.find(t => t.default);
      if (defaultTrack) {
        this.enableCaptions(defaultTrack.srclang);
      }
    }
  }

  changeVideo(): void {
    this.currentVideo = this.selectedVideo;
    this.loadVideo();
    this.play();
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    this.videoPlayer.nativeElement.play()
      .then(() => this.isPlaying = true)
      .catch(error => console.error('Error playing video:', error));
  }

  pause(): void {
    this.videoPlayer.nativeElement.pause();
    this.isPlaying = false;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.videoPlayer.nativeElement.muted = this.isMuted;
  }

  setVolume(): void {
    this.videoPlayer.nativeElement.volume = this.volume;
    this.isMuted = this.volume === 0;
  }

  setPlaybackRate(): void {
    this.videoPlayer.nativeElement.playbackRate = this.playbackRate;
  }

  seek(event: MouseEvent): void {
    const progressBar = event.target as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    this.videoPlayer.nativeElement.currentTime = pos * this.duration;
  }

  toggleCaptions(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const lang = select.value;

    if (lang === 'off') {
      this.disableCaptions();
    } else {
      this.enableCaptions(lang);
    }
  }

  enableCaptions(lang: string): void {
    const video = this.videoPlayer.nativeElement;
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      track.mode = track.language === lang ? 'showing' : 'hidden';
    }
  }

  disableCaptions(): void {
    const video = this.videoPlayer.nativeElement;
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = 'hidden';
    }
  }

  jumpToChapter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const time = parseFloat(select.value);
    if (!isNaN(time)) {
      this.videoPlayer.nativeElement.currentTime = time;
      this.play();
    }
    select.value = '';
  }

  toggleFullscreen(): void {
    const videoContainer = this.videoPlayer.nativeElement.parentElement;

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
    this.currentTime = this.videoPlayer.nativeElement.currentTime;
    this.duration = this.videoPlayer.nativeElement.duration || 0;
  }

  // Handle keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const video = this.videoPlayer.nativeElement;

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
}
