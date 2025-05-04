import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'video',
    loadComponent: () => import('./video-player/video-player.component')
      .then(mod => mod.VideoPlayerComponent)
  }
];
