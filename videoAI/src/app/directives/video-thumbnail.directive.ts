import { Directive, ElementRef, Input, OnChanges, OnDestroy, Output, EventEmitter, SimpleChanges, NgZone } from '@angular/core';

@Directive({
  selector: '[videoThumbnail]',
})
export class VideoThumbnailDirective implements OnChanges, OnDestroy {
  @Input() videoUrl: string = '';
  @Input() captureTime: number = 1; // Default time in seconds
  @Input() maxWidth: number = 320;
  @Input() quality: number = 1; // JPEG quality (0-1)
  @Output() thumbnailGenerated = new EventEmitter<string>();
  @Output() error = new EventEmitter<Error>();

  private video: HTMLVideoElement | null = null;
  private destroyed = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private zone: NgZone
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    // Generate thumbnail when videoUrl changes
    if (changes['videoUrl'] && this.videoUrl) {
      this.generateThumbnail();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cleanupVideoElement();
  }

  private cleanupVideoElement(): void {
    if (this.video) {
      this.video.removeAttribute('src');
      this.video.load();
      this.video = null;
    }
  }

  generateThumbnail(): void {
    if (!this.videoUrl) {
      this.error.emit(new Error('No video URL provided'));
      return;
    }

    // Clean up previous video element if exists
    this.cleanupVideoElement();

    // Create a new video element
    this.video = document.createElement('video');
    this.video.crossOrigin = 'anonymous'; // Handle CORS if needed

    // Create canvas for the thumbnail
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      this.zone.run(() => this.error.emit(new Error('Failed to get canvas context')));
      return;
    }

    // Set up event handling
    const loadHandler = () => {
      if (this.destroyed || !this.video) return;

      // Remove event listeners
      this.video.removeEventListener('loadeddata', loadHandler);

      // Set the current time to capture the frame
      this.video.currentTime = this.captureTime;
    };

    const errorHandler = () => {
      if (this.destroyed) return;

      // Clean up
      this.cleanupEventListeners();

      // Emit error
      this.zone.run(() => this.error.emit(new Error(`Failed to load video: ${this.videoUrl}`)));
    };

    const seekedHandler = () => {
      if (this.destroyed || !this.video || !context) return;

      try {
        // Calculate dimensions
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;

        // Maintain aspect ratio
        const width = this.maxWidth;
        const height = (videoHeight / videoWidth) * width;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw the video frame on the canvas
        context.drawImage(this.video, 0, 0, width, height);

        // Convert to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', this.quality);

        // If the element is an img, set the src directly
        if (this.el.nativeElement instanceof HTMLImageElement) {
          this.el.nativeElement.src = thumbnailUrl;
        }

        // Clean up
        this.cleanupEventListeners();

        // Emit the thumbnail URL
        this.zone.run(() => this.thumbnailGenerated.emit(thumbnailUrl));
      } catch (error) {
        this.zone.run(() => this.error.emit(error instanceof Error ? error : new Error(String(error))));
      }
    };

    const cleanupEventListeners = () => {
      if (!this.video) return;

      this.video.removeEventListener('loadeddata', loadHandler);
      this.video.removeEventListener('error', errorHandler);
      this.video.removeEventListener('seeked', seekedHandler);
    };

    this.cleanupEventListeners = cleanupEventListeners;

    // Set up event listeners
    this.video.addEventListener('loadeddata', loadHandler);
    this.video.addEventListener('error', errorHandler);
    this.video.addEventListener('seeked', seekedHandler);

    // Start loading the video
    this.video.src = this.videoUrl;
    this.video.load();
  }

  private cleanupEventListeners: () => void = () => { };
}
