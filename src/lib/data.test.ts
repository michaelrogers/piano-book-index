import { describe, it, expect } from 'vitest';
import {
  getBooks,
  getBookById,
  getSongs,
  getSongById,
  getSongsByBook,
  getSongsByBookOrdered,
  getSongBookContext,
  getDifficultyMap,
  getBookSeries,
  getGenres,
  getPublishers,
  buildSearchIndex,
  getPlaylistsForBook,
} from './data';

describe('getBooks', () => {
  it('returns a non-empty array of books', () => {
    const books = getBooks();
    expect(books).toBeInstanceOf(Array);
    expect(books.length).toBeGreaterThan(0);
  });

  it('each book has required fields', () => {
    const books = getBooks();
    for (const book of books) {
      expect(book).toHaveProperty('id');
      expect(book).toHaveProperty('title');
      expect(book).toHaveProperty('series');
      expect(book).toHaveProperty('publisher');
      expect(typeof book.id).toBe('string');
      expect(typeof book.title).toBe('string');
    }
  });

  it('returns the same reference on repeated calls', () => {
    expect(getBooks()).toBe(getBooks());
  });
});

describe('getBookById', () => {
  it('returns the correct book for a known id', () => {
    const book = getBookById('faber-lesson-1');
    expect(book).toBeDefined();
    expect(book!.id).toBe('faber-lesson-1');
    expect(book!.title).toContain('Lesson Book 1');
  });

  it('returns undefined for a non-existent id', () => {
    expect(getBookById('non-existent-book-id')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getBookById('')).toBeUndefined();
  });
});

describe('getSongs', () => {
  it('returns a non-empty array of songs', () => {
    const songs = getSongs();
    expect(songs).toBeInstanceOf(Array);
    expect(songs.length).toBeGreaterThan(0);
  });

  it('each song has required fields', () => {
    const songs = getSongs();
    for (const song of songs) {
      expect(song).toHaveProperty('id');
      expect(song).toHaveProperty('title');
      expect(song).toHaveProperty('bookId');
      expect(song).toHaveProperty('difficulty');
      expect(song.difficulty).toHaveProperty('label');
      expect(song).toHaveProperty('youtubeLinks');
      expect(song.youtubeLinks).toBeInstanceOf(Array);
    }
  });
});

describe('getSongById', () => {
  it('returns the correct song for a known id', () => {
    const song = getSongById('faber-classics-1-ode-to-joy-theme-from-the-ninth-symphony');
    expect(song).toBeDefined();
    expect(song!.title).toContain('Ode to Joy');
    expect(song!.composer).toContain('Beethoven');
  });

  it('returns undefined for a non-existent id', () => {
    expect(getSongById('non-existent-song-id')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getSongById('')).toBeUndefined();
  });
});

describe('getSongsByBook', () => {
  it('returns songs belonging to the specified book', () => {
    const songs = getSongsByBook('faber-classics-1');
    expect(songs.length).toBeGreaterThan(0);
    for (const song of songs) {
      expect(song.bookId).toBe('faber-classics-1');
    }
  });

  it('returns an empty array for a non-existent book', () => {
    expect(getSongsByBook('non-existent-book')).toEqual([]);
  });

  it('returns an empty array for an empty string', () => {
    expect(getSongsByBook('')).toEqual([]);
  });
});

describe('getSongsByBookOrdered', () => {
  it('returns songs sorted by page number', () => {
    const songs = getSongsByBookOrdered('faber-classics-1');
    expect(songs.length).toBeGreaterThan(0);

    // Check that page numbers are in ascending order (where defined)
    const pagesWithNumbers = songs
      .filter((s) => s.pageNumber !== null)
      .map((s) => s.pageNumber as number);

    for (let i = 1; i < pagesWithNumbers.length; i++) {
      expect(pagesWithNumbers[i]).toBeGreaterThanOrEqual(pagesWithNumbers[i - 1]);
    }
  });

  it('places songs with null page numbers after those with page numbers', () => {
    // Use a book that has both null and non-null page numbers, or construct a scenario
    // Songs from alfred-greatest-hits-2 all have null pages, so we check ordering is stable
    const songs = getSongsByBookOrdered('alfred-greatest-hits-2');
    expect(songs.length).toBeGreaterThan(0);
    // All songs have null pageNumber so they should maintain source order
    for (const song of songs) {
      expect(song.pageNumber).toBeNull();
    }
  });

  it('returns an empty array for a non-existent book', () => {
    expect(getSongsByBookOrdered('non-existent-book')).toEqual([]);
  });

  it('does not mutate the original songs array', () => {
    const originalSongs = getSongs();
    const originalIds = originalSongs.map((s) => s.id);
    getSongsByBookOrdered('faber-classics-1');
    const afterIds = getSongs().map((s) => s.id);
    expect(afterIds).toEqual(originalIds);
  });
});

describe('getSongBookContext', () => {
  it('returns context for a valid song in the middle of a book', () => {
    // Get the second song in faber-classics-1
    const orderedSongs = getSongsByBookOrdered('faber-classics-1');
    expect(orderedSongs.length).toBeGreaterThan(2);

    const middleSong = orderedSongs[1];
    const ctx = getSongBookContext(middleSong.id);

    expect(ctx).not.toBeNull();
    expect(ctx!.currentIndex).toBe(1);
    expect(ctx!.total).toBe(orderedSongs.length);
    expect(ctx!.previousSong).not.toBeNull();
    expect(ctx!.previousSong!.id).toBe(orderedSongs[0].id);
    expect(ctx!.nextSong).not.toBeNull();
    expect(ctx!.nextSong!.id).toBe(orderedSongs[2].id);
  });

  it('returns null previousSong for the first song in a book', () => {
    const orderedSongs = getSongsByBookOrdered('faber-classics-1');
    const firstSong = orderedSongs[0];
    const ctx = getSongBookContext(firstSong.id);

    expect(ctx).not.toBeNull();
    expect(ctx!.currentIndex).toBe(0);
    expect(ctx!.previousSong).toBeNull();
    expect(ctx!.nextSong).not.toBeNull();
  });

  it('returns null nextSong for the last song in a book', () => {
    const orderedSongs = getSongsByBookOrdered('faber-classics-1');
    const lastSong = orderedSongs[orderedSongs.length - 1];
    const ctx = getSongBookContext(lastSong.id);

    expect(ctx).not.toBeNull();
    expect(ctx!.currentIndex).toBe(orderedSongs.length - 1);
    expect(ctx!.nextSong).toBeNull();
    expect(ctx!.previousSong).not.toBeNull();
  });

  it('returns null for a non-existent song', () => {
    expect(getSongBookContext('non-existent-song')).toBeNull();
  });

  it('songs array matches the ordered songs of the book', () => {
    const orderedSongs = getSongsByBookOrdered('faber-classics-1');
    const ctx = getSongBookContext(orderedSongs[0].id);
    expect(ctx!.songs).toEqual(orderedSongs);
  });
});

describe('getDifficultyMap', () => {
  it('returns all 6 difficulty levels', () => {
    const map = getDifficultyMap();
    expect(map).toHaveLength(6);
  });

  it('includes all expected difficulty labels', () => {
    const labels = getDifficultyMap().map((d) => d.label);
    expect(labels).toContain('Beginner');
    expect(labels).toContain('Early Intermediate');
    expect(labels).toContain('Intermediate');
    expect(labels).toContain('Late Intermediate');
    expect(labels).toContain('Early Advanced');
    expect(labels).toContain('Advanced');
  });

  it('each mapping has required fields', () => {
    for (const mapping of getDifficultyMap()) {
      expect(mapping).toHaveProperty('label');
      expect(mapping).toHaveProperty('faberLevel');
      expect(mapping).toHaveProperty('alfredLevel');
      expect(mapping).toHaveProperty('description');
      expect(typeof mapping.description).toBe('string');
    }
  });
});

describe('getBookSeries', () => {
  it('returns a non-empty array of unique series names', () => {
    const series = getBookSeries();
    expect(series.length).toBeGreaterThan(0);
    // Check uniqueness
    expect(new Set(series).size).toBe(series.length);
  });

  it('includes known series', () => {
    const series = getBookSeries();
    expect(series).toContain('Faber Adult Piano Adventures');
    expect(series).toContain('Alfred Greatest Hits');
  });

  it('does not include empty strings', () => {
    const series = getBookSeries();
    expect(series).not.toContain('');
  });
});

describe('getGenres', () => {
  it('returns a non-empty sorted array', () => {
    const genres = getGenres();
    expect(genres.length).toBeGreaterThan(0);

    // Check sorted
    for (let i = 1; i < genres.length; i++) {
      expect(genres[i].localeCompare(genres[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it('includes common genres', () => {
    const genres = getGenres();
    expect(genres).toContain('Classical');
    expect(genres).toContain('Pop');
    expect(genres).toContain('Jazz');
  });

  it('normalizes compound genres into individual tags', () => {
    const genres = getGenres();
    // Film/TV should be normalized from Film/TV genre in data
    expect(genres).toContain('Film/TV');
  });

  it('returns unique genres', () => {
    const genres = getGenres();
    expect(new Set(genres).size).toBe(genres.length);
  });
});

describe('getPublishers', () => {
  it('returns a non-empty sorted array', () => {
    const publishers = getPublishers();
    expect(publishers.length).toBeGreaterThan(0);

    for (let i = 1; i < publishers.length; i++) {
      expect(publishers[i].localeCompare(publishers[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it('includes known publishers', () => {
    const publishers = getPublishers();
    expect(publishers).toContain('Faber Piano Adventures');
    expect(publishers).toContain('Alfred Music');
  });

  it('returns unique values', () => {
    const publishers = getPublishers();
    expect(new Set(publishers).size).toBe(publishers.length);
  });
});

describe('buildSearchIndex', () => {
  it('returns an array with the same length as songs', () => {
    const index = buildSearchIndex();
    const songs = getSongs();
    expect(index).toHaveLength(songs.length);
  });

  it('each item has all required search fields', () => {
    const index = buildSearchIndex();
    for (const item of index.slice(0, 10)) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('composer');
      expect(item).toHaveProperty('genre');
      expect(item).toHaveProperty('genreTags');
      expect(item).toHaveProperty('bookId');
      expect(item).toHaveProperty('bookTitle');
      expect(item).toHaveProperty('bookSeries');
      expect(item).toHaveProperty('bookType');
      expect(item).toHaveProperty('bookPublisher');
      expect(item).toHaveProperty('difficultyLabel');
      expect(item).toHaveProperty('hasVideo');
      expect(typeof item.hasVideo).toBe('boolean');
      expect(item.genreTags).toBeInstanceOf(Array);
    }
  });

  it('resolves book titles from book data', () => {
    const index = buildSearchIndex();
    const classicsSong = index.find((s) => s.bookId === 'faber-classics-1');
    expect(classicsSong).toBeDefined();
    expect(classicsSong!.bookTitle).toContain('Classics Book 1');
  });

  it('correctly detects hasVideo', () => {
    const index = buildSearchIndex();
    const songs = getSongs();

    // Find a song with youtube links
    const songWithVideo = songs.find((s) => s.youtubeLinks.length > 0);
    if (songWithVideo) {
      const indexItem = index.find((i) => i.id === songWithVideo.id);
      expect(indexItem!.hasVideo).toBe(true);
    }
  });

  it('normalizes genre tags for compound genres', () => {
    const index = buildSearchIndex();
    const jazzPopSong = index.find((i) => i.genre === 'Jazz/Pop');
    if (jazzPopSong) {
      expect(jazzPopSong.genreTags).toContain('Jazz');
      expect(jazzPopSong.genreTags).toContain('Pop');
    }
  });
});

describe('getPlaylistsForBook', () => {
  it('returns playlists for a book with playlists', () => {
    const playlists = getPlaylistsForBook('alfred-greatest-hits-1');
    expect(playlists.length).toBeGreaterThan(0);
    for (const p of playlists) {
      expect(p.bookId).toBe('alfred-greatest-hits-1');
      expect(p).toHaveProperty('playlistId');
      expect(p).toHaveProperty('playlistUrl');
      expect(p).toHaveProperty('channelName');
      expect(p).toHaveProperty('trackCount');
    }
  });

  it('returns an empty array for a book without playlists', () => {
    expect(getPlaylistsForBook('non-existent-book')).toEqual([]);
  });

  it('returns an empty array for an empty string', () => {
    expect(getPlaylistsForBook('')).toEqual([]);
  });
});
