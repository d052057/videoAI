import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  template: `
    <div class="position-fixed bg-dark text-white px-2 py-1 rounded small"
         [style.left.px]="x"
         [style.top.px]="y"
         style="transform: translateX(-50%); pointer-events: none; white-space: nowrap; z-index: 1000;">
      {{ timeDisplay }}
    </div>
  `
})
export class TooltipComponent {
  @Input() x = 0;
  @Input() y = 0;
  @Input() timeDisplay!: string;;
}
