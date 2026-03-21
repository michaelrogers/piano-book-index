#!/usr/bin/env node
/**
 * Validates youtube-playlists-curated.json against books.json and songs.json.
 * Checks for: bad bookId/songId references, duplicate entries, missing fields.
 * Exit code 0 = all valid, 1 = errors found.
 */
import { readFileSync } from 'fs';

const curated = JSON.parse(readFileSync('scripts/youtube-playlists-curated.json', 'utf8'));
const books = JSON.parse(readFileSync('src/data/books.json', 'utf8'));
const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));

const bookIds = new Set(books.map((b) => b.id));
const songIds = new Set(songs.map((s) => s.id));
const songsByBook = new Map();
for (const s of songs) {
  if (!songsByBook.has(s.bookId)) songsByBook.set(s.bookId, []);
  songsByBook.get(s.bookId).push(s);
}

const errors = [];
const warnings = [];

// Validate channels
const channelIds = new Set();
for (const ch of curated.channels) {
  if (!ch.id) errors.push(`Channel missing id: ${JSON.stringify(ch)}`);
  if (!ch.name) errors.push(`Channel missing name: ${ch.id}`);
  if (channelIds.has(ch.id)) errors.push(`Duplicate channel id: ${ch.id}`);
  channelIds.add(ch.id);
}

// Validate playlistBookMappings
const seenMappings = new Set();
for (const m of curated.playlistBookMappings) {
  const key = `${m.channelId}:${m.playlistId}`;
  if (!m.channelId) errors.push(`Mapping missing channelId: ${JSON.stringify(m)}`);
  if (!m.playlistId) errors.push(`Mapping missing playlistId: ${JSON.stringify(m)}`);
  if (!m.bookId) errors.push(`Mapping missing bookId: ${JSON.stringify(m)}`);
  if (m.channelId && !channelIds.has(m.channelId)) {
    errors.push(`Mapping references unknown channel "${m.channelId}": playlist ${m.playlistId}`);
  }
  if (m.bookId && !bookIds.has(m.bookId)) {
    errors.push(`Mapping references unknown book "${m.bookId}": playlist ${m.playlistId}`);
  }
  if (seenMappings.has(key)) {
    warnings.push(`Duplicate mapping: ${key}`);
  }
  seenMappings.add(key);
}

// Validate directSongLinks
const seenDirect = new Set();
for (const d of curated.directSongLinks) {
  const key = `${d.channelId}:${d.songId}:${d.url}`;
  if (!d.channelId) errors.push(`DirectSongLink missing channelId: ${JSON.stringify(d)}`);
  if (!d.songId) errors.push(`DirectSongLink missing songId: ${JSON.stringify(d)}`);
  if (!d.url) errors.push(`DirectSongLink missing url: ${JSON.stringify(d)}`);
  if (d.channelId && !channelIds.has(d.channelId)) {
    errors.push(`DirectSongLink references unknown channel "${d.channelId}": ${d.songId}`);
  }
  if (d.songId && !songIds.has(d.songId)) {
    errors.push(`DirectSongLink references unknown song "${d.songId}": ${d.url}`);
  }
  if (seenDirect.has(key)) {
    warnings.push(`Duplicate directSongLink: ${d.songId} from ${d.channelId}`);
  }
  seenDirect.add(key);
}

// Check for directSongLinks that could be served by playlistBookMappings
// (i.e. the song's book already has a playlist mapping from the same channel)
for (const d of curated.directSongLinks) {
  const song = songs.find((s) => s.id === d.songId);
  if (!song) continue;
  const hasMapping = curated.playlistBookMappings.some(
    (m) => m.channelId === d.channelId && m.bookId === song.bookId
  );
  if (hasMapping) {
    warnings.push(`DirectSongLink may be redundant (book has playlist mapping): ${d.songId} from ${d.channelId}`);
  }
}

// Output
if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
}
if (warnings.length) {
  console.warn(`\n⚠️  ${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}
if (!errors.length && !warnings.length) {
  console.log('✅ curated.json is valid — no errors or warnings.');
}

process.exit(errors.length ? 1 : 0);
