// Example component using the video thumbnail directive
import { Component, OnInit } from '@angular/core';
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
  selector: 'app-video-gallery',
  imports: [CommonModule, VideoThumbnailDirective],
  templateUrl: './video-gallery.component.html',
  styleUrl: './video-gallery.component.scss'
})
export class VideoGalleryComponent implements OnInit {
  videos: VideoItem[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadVideos();
  }

  loadVideos(): void {
    // Example - replace with your actual API call
    this.getVideos().subscribe(videos => {
      this.videos = videos;
    });
  }

  getVideos(): Observable<VideoItem[]> {
    // Example - replace with your actual API call
    return this.http.get<VideoItem[]>('/assets/video_files.json');

    /* For testing you could use hardcoded values:*/
     //return of([
     //  { title: 'Big Buck Bunny', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
     //  { title: 'Elephant Dream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }
     //]);
  }

  onThumbnailGenerated(video: VideoItem, thumbnailUrl: string): void {
    console.log(`Thumbnail generated for: ${video.title}`);
    video.thumbnailUrl = thumbnailUrl;
  }

  onThumbnailError(video: VideoItem, error: Error): void {
    console.error(`Error generating thumbnail for ${video.title}:`, error);
    // Set a fallback image
    video.thumbnailUrl = 'assets/images/fallback-thumbnail.jpg';
  }

  playVideo(video: VideoItem): void {
    // Implement your video playback logic
    console.log(`Playing video: ${video.title}`);
    // Example: Navigate to video player page or open a modal
  }
}
