import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { VideoThumbnailDirective } from '../directives/video-thumbnail.directive';

interface VideoItem {
  title: string;
  url: string;
  thumbnailUrl?: string;
}

@Component({
  selector: 'app-video-list',
  imports: [CommonModule, VideoThumbnailDirective],
  templateUrl: './video-list.component.html',
  styleUrl: './video-list.component.scss'
})
export class VideoListComponent implements OnInit {
  videos: VideoItem[] = [];
  activeThumbnail: string | null = null;
  previewPosition = { x: 0, y: 0 };

  // Optional offset for the thumbnail preview
  previewOffset = { x: 20, y: 10 };

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadVideos();
  }

  loadVideos(): void {
    this.getVideos().subscribe(videos => {
      this.videos = videos;
    });
  }

  getVideos(): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>('/assets/video_files.json');
  }

  onThumbnailGenerated(video: VideoItem, thumbnailUrl: string): void {
    video.thumbnailUrl = thumbnailUrl;
  }

  onThumbnailError(video: VideoItem, error: Error): void {
    console.error(`Error generating thumbnail for ${video.title}:`, error);
    // Set a fallback image
    video.thumbnailUrl = 'assets/images/fallback-thumbnail.jpg';
  }

  showThumbnail(video: VideoItem, event?: MouseEvent): void {
    if (video.thumbnailUrl) {
      this.activeThumbnail = video.thumbnailUrl;

      // Position the thumbnail near the cursor if event is available
      if (event) {
        this.updatePreviewPosition(event);
      }
    }
  }

  hideThumbnail(): void {
    this.activeThumbnail = null;
  }

  // Update the thumbnail position when mouse moves
  updatePreviewPosition(event: MouseEvent): void {
    // Apply offset to avoid thumbnail appearing directly under cursor
    this.previewPosition = {
      x: event.clientX + this.previewOffset.x,
      y: event.clientY + this.previewOffset.y
    };

    // Prevent the thumbnail from going off-screen
    const thumbnail = document.querySelector('.thumbnail-preview') as HTMLElement;
    if (thumbnail) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const thumbnailWidth = thumbnail.offsetWidth;
      const thumbnailHeight = thumbnail.offsetHeight;

      // Adjust X position if needed
      if (this.previewPosition.x + thumbnailWidth > viewportWidth) {
        this.previewPosition.x = event.clientX - thumbnailWidth - this.previewOffset.x;
      }

      // Adjust Y position if needed
      if (this.previewPosition.y + thumbnailHeight > viewportHeight) {
        this.previewPosition.y = event.clientY - thumbnailHeight - this.previewOffset.y;
      }
    }
  }

  // Add this method to track mouse movement
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.activeThumbnail) {
      this.updatePreviewPosition(event);
    }
  }
}
