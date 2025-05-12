import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoThumbnailDirective } from '../directives/video-thumbnail.directive';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
interface VideoItem {
  title: string;
  url: string;
  thumbnailUrl?: string;
}

@Component({
  selector: 'app-simple-video-list',
  imports: [CommonModule, VideoThumbnailDirective],
  templateUrl: './simple-video-list.component.html',
  styleUrl: './simple-video-list.component.scss'
})

export class SimpleVideoListComponent implements OnInit {
  videos: VideoItem[] = [];

  // Preview state
  showPreview: boolean = false;
  currentThumbnail: string | null = null;
  previewX: number = 0;
  previewY: number = 0;

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

  setThumbnail(video: VideoItem, thumbnailUrl: string): void {
    video.thumbnailUrl = thumbnailUrl;
  }

  onMouseEnter(event: MouseEvent, video: VideoItem): void {
    if (video.thumbnailUrl) {
      this.currentThumbnail = video.thumbnailUrl;
      this.showPreview = true;
      this.updatePreviewPosition(event);
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.showPreview) {
      this.updatePreviewPosition(event);
    }
  }

  onMouseLeave(): void {
    this.showPreview = false;
  }

  private updatePreviewPosition(event: MouseEvent): void {
    // Offset from the cursor
    const offsetX = 15;
    const offsetY = 10;

    this.previewX = event.clientX + offsetX;
    this.previewY = event.clientY + offsetY;

    // Prevent preview from going off screen
    const preview = document.querySelector('.thumbnail-preview') as HTMLElement;
    if (preview) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const previewWidth = preview.offsetWidth;
      const previewHeight = preview.offsetHeight;

      if (this.previewX + previewWidth > viewportWidth) {
        this.previewX = event.clientX - previewWidth - offsetX;
      }

      if (this.previewY + previewHeight > viewportHeight) {
        this.previewY = event.clientY - previewHeight - offsetY;
      }
    }
  }
}
