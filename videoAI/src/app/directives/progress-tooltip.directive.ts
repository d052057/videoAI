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
  @Input() thumbVideo!: HTMLVideoElement;

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
    const video = this.thumbVideo; // use the injected thumb video

    if (!ctx || !video) return;

    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    };

    // Wait for seek to complete before drawing
    if (video.readyState < 2) {
      video.addEventListener('loadeddata', () => {
        video.currentTime = time;
      }, { once: true });
    } else {
      const handleSeeked = () => {
        drawFrame();
        video.removeEventListener('seeked', handleSeeked);
      };
      video.addEventListener('seeked', handleSeeked);
      video.currentTime = time;
    }
  }
}
