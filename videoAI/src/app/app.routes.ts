import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'video',
    loadComponent: () => import('./video-player/video-player.component')
      .then(mod => mod.VideoPlayerComponent)
  },
  {
    path: 'thumbnail',
    loadComponent: () => import('./video-gallery/video-gallery.component')
      .then(mod => mod.VideoGalleryComponent)
  },
  {
    path: 'videolist',
    loadComponent: () => import('./video-list/video-list.component')
      .then(mod => mod.VideoListComponent)
  },
  {
    path: 'simplevideolist',
    loadComponent: () => import('./simple-video-list/simple-video-list.component')
      .then(mod => mod.SimpleVideoListComponent)
  }
];
