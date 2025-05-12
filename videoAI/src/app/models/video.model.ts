export interface AudioTrack {
  src: string;
  kind: string;
  srclang: string;
  label: string;
  default?: boolean;
}
export interface VideoTrack {
  src: string;
  kind: string;
  srclang: string;
  label: string;
  default?: boolean;
}

export interface VideoSource {
  src: string;
  type: string;
  title: string;
  duration: number;
  tracks?: VideoTrack[];
  audioTracks?: AudioTrack[]; // Add this line
  chapters?: Chapter[]; // Add this line
  hasCaptions?: boolean;
  hasChapters?: boolean;
  hasAudioTracks?: boolean;
}

export interface Chapter {
  title: string;
  time: number;
}
export interface SubtitleCue {
  start: number;  // in seconds
  end: number;    // in seconds
  text: string;
}
export const speed_array: number[] = [0.5, 0.75, 1, 1.25, 1.50, 1.75, 2, 2.25, 2.50, 2.75, 3]  
// Video Library
//videoLibrary: VideoSource[] = [
//  {
//    title: 'Return of the Condor Heroes',
//    src: 'assets/videos/Return of the Condor Heroes.mp4',
//    type: 'video/mp4',
//    hasCaptions: false,
//    audioTracks: [
//      {
//        src: 'assets/audio/sample1-en.mp3',
//        kind: 'audio',
//        srclang: 'en',
//        label: 'English',
//        default: true
//      },
//      {
//        src: 'assets/audio/sample1-es.mp3',
//        kind: 'audio',
//        srclang: 'es',
//        label: 'Spanish'
//      }
//    ],
//    tracks: [
//      {
//        src: '',
//        kind: 'subtitles',
//        srclang: 'en',
//        label: 'English',
//        default: true
//      }
//    ]
//  },
//  {
//    title: 'David Blaine',
//    src: 'assets/videos/David Blaine.mp4',
//    type: 'video/mp4',
//    hasCaptions: true,
//    audioTracks: [
//      {
//        src: 'assets/audio/sample1-en.mp3',
//        kind: 'audio',
//        srclang: 'en',
//        label: 'English',
//        default: true
//      },
//      {
//        src: 'assets/audio/sample1-es.mp3',
//        kind: 'audio',
//        srclang: 'es',
//        label: 'Spanish'
//      }
//    ],
//    tracks: [
//      {
//        src: 'assets/subtitles/David Blaine-en.vtt',
//        kind: 'subtitles',
//        srclang: 'en',
//        label: 'English',
//        default: true
//      },
//      {
//        src: 'assets/subtitles/David Blaine-km.vtt',
//        kind: 'subtitles',
//        srclang: 'km',
//        label: 'Khmer'
//      }
//    ]
//  }

//];
//chapters: Chapter[] = [
//  { title: 'Introduction', time: 0 },
//  { title: 'Main Content', time: 30 },
//  { title: 'Conclusion', time: 120 }
//];
