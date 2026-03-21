#!/usr/bin/env node

/**
 * Backport songs from trusted YouTube playlists for books that have 0 songs.
 *
 * This creates song entries from Amy Comparetto's playlist video titles,
 * setting trackListingSource to 'youtube-playlist' on the book.
 *
 * Only runs for books with exactly 0 existing songs, and only from playlists
 * that are mapped in youtube-playlists-curated.json.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const songsPath = join(ROOT, 'src/data/songs.json');
const booksPath = join(ROOT, 'src/data/books.json');
const curatedPath = join(ROOT, 'scripts/youtube-playlists-curated.json');

const songs = JSON.parse(readFileSync(songsPath, 'utf-8'));
const books = JSON.parse(readFileSync(booksPath, 'utf-8'));
const curated = JSON.parse(readFileSync(curatedPath, 'utf-8'));

// Difficulty map by series
const SERIES_DIFFICULTY = {
  'BigTime Piano': { label: 'Late Intermediate', faberLevel: 'Level 4', alfredLevel: null },
  'ShowTime Piano': { label: 'Early Intermediate', faberLevel: 'Level 2A', alfredLevel: null },
  'FunTime Piano': { label: 'Intermediate', faberLevel: 'Level 3A-3B', alfredLevel: null },
};

// Genre map from seriesLevel
const GENRE_FROM_LEVEL = {
  "Jazz & Blues": "Jazz & Blues",
  "Rock 'n Roll": "Rock 'n Roll",
  "Kids' Songs": "Kids' Songs",
};

// Find books with 0 songs that have a matching playlist
const existingSongBookIds = new Set(songs.map(s => s.bookId));
const booksWithSongs = new Set();
songs.forEach(s => booksWithSongs.add(s.bookId));

const candidates = [];
for (const mapping of curated.playlistBookMappings) {
  const book = books.find(b => b.id === mapping.bookId);
  if (!book) continue;

  const songCount = songs.filter(s => s.bookId === mapping.bookId).length;
  if (songCount > 0) continue;

  candidates.push({ mapping, book });
}

if (candidates.length === 0) {
  console.log('No backport candidates found (all mapped books already have songs).');
  process.exit(0);
}

console.log(`Found ${candidates.length} backport candidates:\n`);

let totalSongsCreated = 0;

for (const { mapping, book } of candidates) {
  const difficulty = SERIES_DIFFICULTY[book.series];
  if (!difficulty) {
    console.log(`  SKIP ${book.id} — unknown series "${book.series}"`);
    continue;
  }

  const genre = GENRE_FROM_LEVEL[book.seriesLevel] || book.seriesLevel;

  console.log(`  ${book.id}: ${mapping.tracks.length} tracks from "${mapping.playlistTitle}" (${mapping.channelName})`);

  for (const track of mapping.tracks) {
    // Extract song title from video title by removing parenthetical book name
    let title = track.videoTitle
      .replace(/\s*\(.*?\)\s*$/, '')    // Remove trailing (BookName) 
      .replace(/\s*\[.*?\]\s*/g, ' ')   // Remove [annotations] but keep surrounding text
      .trim();

    // Generate slug-based ID
    const slug = title
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const songId = `${book.id}-${slug}`;

    // Check for duplicates
    if (songs.find(s => s.id === songId)) {
      console.log(`    SKIP duplicate: ${songId}`);
      continue;
    }

    const song = {
      id: songId,
      title,
      composer: '',
      arranger: 'Nancy and Randall Faber',
      genre,
      bookId: book.id,
      pageNumber: null,
      difficulty: { ...difficulty },
      youtubeLinks: [
        {
          url: track.url,
          artist: mapping.channelName,
          description: mapping.playlistTitle,
          playlistId: mapping.playlistId,
          playlistUrl: mapping.playlistUrl,
        },
      ],
      notes: 'Song data sourced from YouTube playlist (Amy Comparetto).',
    };

    songs.push(song);
    totalSongsCreated++;
    console.log(`    + ${songId}`);
  }

  // Update book's trackListingSource
  const bookIndex = books.findIndex(b => b.id === book.id);
  if (bookIndex !== -1) {
    books[bookIndex].trackListingSource = 'youtube-playlist';
    console.log(`    Updated ${book.id} trackListingSource → youtube-playlist`);
  }
}

// Write updated files
writeFileSync(songsPath, JSON.stringify(songs, null, 2) + '\n');
writeFileSync(booksPath, JSON.stringify(books, null, 2) + '\n');

console.log(`\nDone! Created ${totalSongsCreated} songs. Updated ${candidates.length} books.`);
