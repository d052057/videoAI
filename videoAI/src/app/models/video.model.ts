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
  tracks?: VideoTrack[];
  audioTracks?: AudioTrack[]; // Add this line
  hasCaptions?: boolean;
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
