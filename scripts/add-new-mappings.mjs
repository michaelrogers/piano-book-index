#!/usr/bin/env node
/**
 * Add new playlist-to-book mappings to curated.json for:
 * - 92pianokeys: Alfred Adult AIO Levels 1, 2, 3
 * - amy-comparetto: Library of Easy Piano Classics
 */
import { readFileSync, writeFileSync } from 'fs';

const CURATED_PATH = 'scripts/youtube-playlists-curated.json';
const curated = JSON.parse(readFileSync(CURATED_PATH, 'utf8'));
const playlistData = JSON.parse(readFileSync('/tmp/new-playlist-videos.json', 'utf8'));

const NEW_MAPPINGS = [
  {
    channelId: '92pianokeys',
    channelName: '92pianokeys',
    playlistId: 'PLIx-hGjmqNJE9M_m1oMkNl8BRdATc1m8d',
    playlistTitle: "Alfred's Adult All-In-One Level 1",
    bookId: 'alfred-adult-aio-1'
  },
  {
    channelId: '92pianokeys',
    channelName: '92pianokeys',
    playlistId: 'PLIx-hGjmqNJEm1DLb4A6uYnrzJUl_tzCe',
    playlistTitle: "Alfred's Adult All-In-One Level 2",
    bookId: 'alfred-adult-aio-2'
  },
  {
    channelId: '92pianokeys',
    channelName: '92pianokeys',
    playlistId: 'PLIx-hGjmqNJH9V3NTh6g3jl7unuNUTQvt',
    playlistTitle: "Alfred's Adult All-In-One Level 3",
    bookId: 'alfred-adult-aio-3'
  },
  {
    channelId: 'amy-comparetto',
    channelName: 'Amy Comparetto',
    playlistId: 'PL7ucElDiXf1QlJJ79ho-Svy9LWegYStIL',
    playlistTitle: 'Easy Piano Classics - Book One',
    bookId: 'library-of-easy-piano-classics'
  }
];

const existingPlaylists = new Set(curated.playlistBookMappings.map(m => m.playlistId));

let added = 0;
for (const mapping of NEW_MAPPINGS) {
  if (existingPlaylists.has(mapping.playlistId)) {
    console.log(`Already exists: ${mapping.playlistId} -> ${mapping.bookId}`);
    continue;
  }
  
  const videos = playlistData[mapping.playlistId] || [];
  const tracks = videos.map(v => ({
    videoId: v.videoId,
    videoTitle: v.title,
    url: v.url
  }));
  
  curated.playlistBookMappings.push({
    channelId: mapping.channelId,
    channelName: mapping.channelName,
    playlistId: mapping.playlistId,
    playlistTitle: mapping.playlistTitle,
    playlistUrl: `https://www.youtube.com/playlist?list=${mapping.playlistId}`,
    bookId: mapping.bookId,
    tracks
  });
  
  console.log(`Added: ${mapping.playlistId} -> ${mapping.bookId} (${tracks.length} tracks)`);
  added++;
}

console.log(`\nTotal mappings: ${curated.playlistBookMappings.length} (added ${added})`);
writeFileSync(CURATED_PATH, JSON.stringify(curated, null, 2) + '\n');
console.log('Wrote updated curated.json');
