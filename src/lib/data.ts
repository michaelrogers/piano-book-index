import type { Book, Song, SongSearchItem, DifficultyMapping, SongBookContext, BookPlaylist } from './types';
import booksData from '../data/books.json';
import songsData from '../data/songs.json';
import difficultyMapData from '../data/difficulty-map.json';
import bookPlaylistsData from '../data/book-playlists.json';
import songLinksData from '../data/song-links.json';
import amazonVerifiedData from '../data/amazon-verified.json';

const books: Book[] = booksData as Book[];
const songs: Song[] = songsData as Song[];
const difficultyMap: DifficultyMapping[] = difficultyMapData as DifficultyMapping[];
const bookPlaylists: BookPlaylist[] = bookPlaylistsData as BookPlaylist[];
const songLinks: Record<string, string[]> = songLinksData;

interface AmazonVerifiedEntry {
  bookId: string;
  asin: string;
  expectedTitle: string;
  verifiedAt: string;
  verifiedMethod: string;
  notes?: string;
}

interface AmazonVerifiedData {
  books: AmazonVerifiedEntry[];
}

const amazonVerifiedEntries = (amazonVerifiedData as AmazonVerifiedData).books;
const amazonVerifiedByBookId = new Map(amazonVerifiedEntries.map((entry) => [entry.bookId, entry]));
const songOrderIndex = new Map(songs.map((song, i) => [song.id, i]));

const amazonTag = import.meta.env.PUBLIC_AMAZON_TAG || '';

export const hasAmazonAffiliate = amazonTag.length > 0;

export function getAmazonAffiliateUrl(url: string): string {
  if (!url || !amazonTag) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tag=${amazonTag}`;
}

export function getBookAmazonUrl(bookId: string): string {
  const entry = amazonVerifiedByBookId.get(bookId);
  if (!entry) return '';
  return `https://www.amazon.com/dp/${entry.asin}`;
}

export function getBooks(): Book[] {
  return books;
}

export function getBookById(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}

export function getSongs(): Song[] {
  return songs;
}

export function getSongById(id: string): Song | undefined {
  return songs.find((s) => s.id === id);
}

export function getSongsByBook(bookId: string): Song[] {
  return songs.filter((s) => s.bookId === bookId);
}

/**
 * Returns songs in a book ordered by page number, then by source order for stable fallback.
 */
export function getSongsByBookOrdered(bookId: string): Song[] {
  return [...getSongsByBook(bookId)].sort((a, b) => {
    if (a.pageNumber !== null && b.pageNumber !== null && a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }
    if (a.pageNumber === null && b.pageNumber !== null) {
      return 1;
    }
    if (a.pageNumber !== null && b.pageNumber === null) {
      return -1;
    }
    return (songOrderIndex.get(a.id) ?? 0) - (songOrderIndex.get(b.id) ?? 0);
  });
}

/**
 * Returns previous/next navigation and listing context for a song within its book.
 */
export function getSongBookContext(songId: string): SongBookContext | null {
  const currentSong = getSongById(songId);
  if (!currentSong) {
    return null;
  }

  const songsInBook = getSongsByBookOrdered(currentSong.bookId);
  const currentIndex = songsInBook.findIndex((song) => song.id === songId);
  if (currentIndex < 0) {
    return null;
  }

  return {
    songs: songsInBook,
    currentIndex,
    total: songsInBook.length,
    previousSong: currentIndex > 0 ? songsInBook[currentIndex - 1] : null,
    nextSong: currentIndex < songsInBook.length - 1 ? songsInBook[currentIndex + 1] : null,
  };
}

export function getDifficultyMap(): DifficultyMapping[] {
  return difficultyMap;
}

export function getBookSeries(): string[] {
  return [...new Set(books.map((b) => b.series).filter(Boolean))] as string[];
}

export function getGenres(): string[] {
  const allTags = songs.flatMap((s) => normalizeGenre(s.genre));
  return [...new Set(allTags)].sort();
}

const GENRE_MAP: Record<string, string[]> = {
  'Film/TV': ['Film/TV'],
  'Pop/Film': ['Pop', 'Film/TV'],
  'Film/Pop': ['Film/TV', 'Pop'],
  'Film/Musical Theatre': ['Film/TV', 'Musical Theatre'],
  'Jazz/Pop': ['Jazz', 'Pop'],
  'Disco/Pop': ['Disco', 'Pop'],
  'Pop/Rock': ['Pop', 'Rock'],
  'Pop/Soul': ['Pop', 'Soul'],
  'Pop/Latin': ['Pop', 'Latin'],
  'Pop/Folk': ['Pop', 'Folk'],
  'Folk/Rock': ['Folk', 'Rock'],
};

function normalizeGenre(genre: string): string[] {
  if (GENRE_MAP[genre]) return GENRE_MAP[genre];
  return [genre];
}

export function getPublishers(): string[] {
  return [...new Set(books.map((b) => b.publisher))].sort();
}

/** Build a flattened search index with book titles resolved */
export function buildSearchIndex(): SongSearchItem[] {
  return songs.map((song) => {
    const book = getBookById(song.bookId);
    return {
      id: song.id,
      title: song.title,
      composer: song.composer,
      genre: song.genre,
      genreTags: normalizeGenre(song.genre),
      bookId: song.bookId,
      bookTitle: book?.title ?? '',
      bookSeries: book?.series ?? '',
      bookType: book?.bookType ?? 'companion',
      bookCoverImage: book?.coverImage ?? '',
      bookPublisher: book?.publisher ?? '',
      difficultyLabel: song.difficulty.label,
      pageNumber: song.pageNumber,
      hasVideo: song.youtubeLinks.length > 0,
    };
  });
}

/** Get YouTube playlists for a book */
export function getPlaylistsForBook(bookId: string): BookPlaylist[] {
  return bookPlaylists.filter((p) => p.bookId === bookId);
}

const DIFFICULTY_ORDER: Record<string, number> = {
  'Beginner': 0,
  'Early Intermediate': 1,
  'Intermediate': 2,
  'Late Intermediate': 3,
  'Early Advanced': 4,
  'Advanced': 5,
};

// Build reverse lookup: songId → normalized key
const songToLinkKey = new Map<string, string>();
for (const [key, ids] of Object.entries(songLinks)) {
  for (const id of ids) {
    songToLinkKey.set(id, key);
  }
}

/** Check if a song appears in other books */
export function hasRelatedSongs(songId: string): boolean {
  return songToLinkKey.has(songId);
}

/** Get the same song in other books, sorted by difficulty */
export function getRelatedSongs(songId: string): Song[] {
  const key = songToLinkKey.get(songId);
  if (!key) return [];
  const ids = songLinks[key];
  if (!ids) return [];
  return ids
    .filter((id) => id !== songId)
    .map((id) => getSongById(id))
    .filter((s): s is Song => s !== undefined)
    .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty.label] ?? 99) - (DIFFICULTY_ORDER[b.difficulty.label] ?? 99));
}
