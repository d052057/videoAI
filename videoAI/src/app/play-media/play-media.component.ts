import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { VideoAudioSyncService } from '../services/video.service';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { of } from 'rxjs';
import { VideoSource, AudioTrack, Chapter, VideoTrack } from '../models/video.model';
@Component({
  selector: 'app-play-media',
  imports: [VideoPlayerComponent],
  templateUrl: './play-media.component.html',
  styleUrl: './play-media.component.scss'
})
export class PlayMediaComponent implements OnInit, OnDestroy {
  service = inject(VideoAudioSyncService);
  data!: VideoSource[];
  private destroy$ = new Subject<void>();
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

        this.data = data;
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
}
