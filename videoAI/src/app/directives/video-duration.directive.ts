import { Directive, ElementRef, EventEmitter, Input, Output } from '@angular/core';

@Directive({
  selector: '[appVideoDuration]'
})
export class VideoDurationDirective {

  @Input('videoDuration') src!: string;
  @Output() durationLoaded = new EventEmitter<number>();

  constructor(private el: ElementRef) { }

  ngOnInit() {
    const video = document.createElement('video');
    video.addEventListener('loadedmetadata', () => {
      const duration = Math.floor(video.duration);
      this.durationLoaded.emit(duration);
    });
    video.src = this.src;
  }
}
