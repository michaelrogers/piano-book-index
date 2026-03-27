#!/usr/bin/env node
/**
 * Add songs for Greatest Hits Book 3 and Popular Hits Level 2
 * from YouTube playlist data (Let's Play Piano Methods channel).
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const songsPath = ROOT + 'src/data/songs.json';
const booksPath = ROOT + 'src/data/books.json';
const curatedPath = ROOT + 'scripts/youtube-playlists-curated.json';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchPlaylistData(playlistId) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const html = execSync(
    `curl -s -L -A '${UA}' '${url}'`,
    { encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 }
  );

  // Extract ytInitialData
  const match = html.match(/var ytInitialData = ({.+?});/s) ||
                html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
  if (!match) throw new Error('Could not extract ytInitialData');
  const data = JSON.parse(match[1]);

  const videos = [];
  function findVideos(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 20) return;
    if (obj.playlistVideoRenderer) {
      const r = obj.playlistVideoRenderer;
      const videoId = r.videoId;
      const title = r.title?.runs?.[0]?.text || '';
      if (videoId && title) {
        videos.push({ videoId, title, url: `https://www.youtube.com/watch?v=${videoId}` });
      }
    }
    if (Array.isArray(obj)) {
      for (const item of obj) findVideos(item, depth + 1);
    } else {
      for (const key of Object.keys(obj)) findVideos(obj[key], depth + 1);
    }
  }
  findVideos(data);
  return videos;
}

function parseSongFromVideoTitle(videoTitle) {
  // Format: "Alfred's Greatest Hits Level 3, Page 2, Getting to Know You"
  // or: "Alfred's Basic Adult Popular Hits Level 2, Page 2, Firework"
  const match = videoTitle.match(/Page (\d+),\s*(.+)$/);
  if (!match) return null;
  return { pageNumber: parseInt(match[1], 10), title: match[2].trim() };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Playlists config
const playlists = [
  {
    playlistId: 'PL8hZtgRyL9WQlYLjT1CxiE33XYfNCTGZ_',
    bookId: 'alfred-greatest-hits-3',
    channelId: 'lets-play-piano-methods',
    channelName: "Let's Play Piano Methods",
    arranger: '',
    editors: 'E. L. Lancaster and Morton Manus',
    difficulty: { label: 'Intermediate', faberLevel: null, alfredLevel: 'Level 3' },
    genre: 'Mixed Repertoire',
  },
  {
    playlistId: 'PL8hZtgRyL9WTbgw5zLVI6KCo7ans6qyOs',
    bookId: 'alfred-popular-hits-2',
    channelId: 'lets-play-piano-methods',
    channelName: "Let's Play Piano Methods",
    arranger: 'Tom Gerou',
    editors: '',
    difficulty: { label: 'Early Intermediate', faberLevel: null, alfredLevel: 'Level 2' },
    genre: 'Popular',
  },
];

const songs = JSON.parse(readFileSync(songsPath, 'utf-8'));
const books = JSON.parse(readFileSync(booksPath, 'utf-8'));
const curated = JSON.parse(readFileSync(curatedPath, 'utf-8'));

let totalAdded = 0;

for (const pl of playlists) {
  console.log(`\nFetching playlist for ${pl.bookId}...`);
  const videos = fetchPlaylistData(pl.playlistId);
  console.log(`  Got ${videos.length} videos`);

  const existingSongCount = songs.filter(s => s.bookId === pl.bookId).length;
  if (existingSongCount > 0) {
    console.log(`  SKIP — ${pl.bookId} already has ${existingSongCount} songs`);
    continue;
  }

  const playlistUrl = `https://www.youtube.com/playlist?list=${pl.playlistId}`;
  const tracks = [];

  for (const video of videos) {
    const parsed = parseSongFromVideoTitle(video.title);
    if (!parsed) {
      console.log(`  SKIP unparseable: ${video.title}`);
      continue;
    }

    const songId = `${pl.bookId}-${slugify(parsed.title)}`;

    // Check for duplicates
    if (songs.find(s => s.id === songId)) {
      console.log(`  SKIP duplicate: ${songId}`);
      continue;
    }

    const song = {
      id: songId,
      title: parsed.title,
      composer: '',
      arranger: pl.arranger,
      genre: pl.genre,
      bookId: pl.bookId,
      pageNumber: parsed.pageNumber,
      difficulty: { ...pl.difficulty },
      youtubeLinks: [{
        url: video.url,
        artist: pl.channelName,
        description: `${pl.channelName} - ${pl.bookId}`,
        playlistId: pl.playlistId,
        playlistUrl,
      }],
      notes: `Song data sourced from YouTube playlist (${pl.channelName}).`,
    };

    songs.push(song);
    tracks.push({
      videoId: video.videoId,
      videoTitle: video.title,
      url: video.url,
    });
    totalAdded++;
    console.log(`  + ${songId} (p.${parsed.pageNumber})`);
  }

  // Update book trackListingSource
  const bookIdx = books.findIndex(b => b.id === pl.bookId);
  if (bookIdx !== -1) {
    books[bookIdx].trackListingSource = 'youtube-playlist';
    console.log(`  Updated ${pl.bookId} trackListingSource → youtube-playlist`);
  }

  // Add to curated playlists
  const existingMapping = curated.playlistBookMappings.find(m => m.playlistId === pl.playlistId);
  if (!existingMapping) {
    curated.playlistBookMappings.push({
      channelId: pl.channelId,
      channelName: pl.channelName,
      playlistId: pl.playlistId,
      playlistTitle: `${pl.bookId} (autolinked)`,
      playlistUrl,
      bookId: pl.bookId,
      tracks,
    });
    console.log(`  Added playlist mapping for ${pl.bookId}`);
  }
}

writeFileSync(songsPath, JSON.stringify(songs, null, 2) + '\n');
writeFileSync(booksPath, JSON.stringify(books, null, 2) + '\n');
writeFileSync(curatedPath, JSON.stringify(curated, null, 2) + '\n');

console.log(`\nDone! Added ${totalAdded} songs.`);
console.log(`Total songs: ${songs.length}, Total books: ${books.length}`);
