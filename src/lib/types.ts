export type BookType = 'lesson' | 'companion';

/** How the track listing was obtained — determines confidence level */
export type TrackListingSource = 'publisher-website' | 'manual-entry' | 'photo-index' | 'youtube-playlist';

export interface Book {
  id: string;
  title: string;
  series: string;
  seriesLevel: string;
  bookType: BookType;
  publisher: string;
  isbn: string;
  coverImage: string;
  pageCount: number | null;
  description: string;
  amazonUrl: string;
  trackListingSource?: TrackListingSource | null;
}

export interface YouTubeLink {
  url: string;
  artist: string;
  description: string;
  playlistId?: string;
  playlistUrl?: string;
}

export interface Difficulty {
  label: DifficultyLabel;
  faberLevel: string | null;
  alfredLevel: string | null;
}

export type DifficultyLabel =
  | 'Beginner'
  | 'Early Intermediate'
  | 'Intermediate'
  | 'Late Intermediate'
  | 'Early Advanced'
  | 'Advanced';

export interface Song {
  id: string;
  title: string;
  composer: string;
  arranger: string;
  genre: string;
  bookId: string;
  pageNumber: number | null;
  difficulty: Difficulty;
  youtubeLinks: YouTubeLink[];
  notes: string;
}

export interface DifficultyMapping {
  label: DifficultyLabel;
  faberLevel: string;
  faberSupplementary: string;
  alfredLevel: string;
  description: string;
}

/** Flattened song data used by the search index */
export interface SongSearchItem {
  id: string;
  title: string;
  composer: string;
  genre: string;
  genreTags: string[];
  bookId: string;
  bookTitle: string;
  bookSeries: string;
  bookType: BookType;
  bookCoverImage: string;
  bookPublisher: string;
  difficultyLabel: DifficultyLabel;
  pageNumber: number | null;
  hasVideo: boolean;
}

export interface SongBookContext {
  songs: Song[];
  currentIndex: number;
  total: number;
  previousSong: Song | null;
  nextSong: Song | null;
}

export interface BookPlaylist {
  bookId: string;
  playlistId: string;
  playlistTitle: string;
  playlistUrl: string;
  channelName: string;
  trackCount: number;
}
