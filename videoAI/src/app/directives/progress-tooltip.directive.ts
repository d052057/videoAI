import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  ViewContainerRef,
  ComponentRef,
  inject,
} from '@angular/core';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Directive({
  selector: '[progressTooltip]',
  standalone: true
})
export class ProgressTooltipDirective {
  private tooltipRef: ComponentRef<TooltipComponent> | null = null;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);
  @Input('progressTooltip') progressTooltip: any;
  @Input() duration = 0;
  @Input() videoElement!: HTMLVideoElement;
  @Input() canvasElement!: HTMLCanvasElement;

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.duration || !this.videoElement || !this.canvasElement) return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    const hoverTime = Math.min(Math.max(pos * this.duration, 0), this.duration);

    const timeDisplay = this.formatTime(hoverTime);

    if (!this.tooltipRef) {
      this.tooltipRef = this.vcr.createComponent(TooltipComponent);
    }


    this.tooltipRef.setInput('x', event.clientX);
    this.tooltipRef.setInput('y', event.clientY - 30);
    this.tooltipRef.setInput('timeDisplay', timeDisplay);

    this.drawThumbnail(hoverTime);
    this.canvasElement.style.left = `${event.clientX}px`;
    this.canvasElement.style.top = `${event.clientY - 130}px`;
    this.canvasElement.style.display = 'block';
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.tooltipRef?.destroy();
    this.tooltipRef = null;

    if (this.canvasElement) {
      this.canvasElement.style.display = 'none';
    }
  }

  private formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  private drawThumbnail(time: number): void {
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    const video = this.videoElement;

    if (!ctx || !video) return;

    // Seek silently in a cloned video element to avoid interrupting playback
    const tempVideo = video.cloneNode(true) as HTMLVideoElement;
    tempVideo.muted = true;
    tempVideo.currentTime = time;

    // Ensure video data is loaded at the frame
    tempVideo.addEventListener('seeked', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
    }, { once: true });

    tempVideo.load(); // Trigger load
  }
}
