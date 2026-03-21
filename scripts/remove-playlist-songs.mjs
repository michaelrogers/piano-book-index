import { readFileSync, writeFileSync } from 'fs';

const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));
const playlists = JSON.parse(readFileSync('scripts/youtube-playlists-curated.json', 'utf8'));

// Get all book IDs that have playlist mappings
const playlistBookIds = new Set(playlists.playlistBookMappings.map(m => m.bookId));

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractSongTitle(videoTitle) {
  // Remove channel suffix like "(BigTime Piano Popular)"
  let title = videoTitle.replace(/\s*\([^)]*Piano[^)]*\)\s*$/i, '');
  // Remove brackets
  title = title.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();
  return title;
}

// Build set of IDs that would have been created by add-songs-from-playlists.mjs
const autoAddedIds = new Set();
for (const mapping of playlists.playlistBookMappings) {
  for (const track of (mapping.tracks || [])) {
    const title = extractSongTitle(track.videoTitle);
    const id = `${mapping.bookId}-${slugify(title)}`;
    autoAddedIds.add(id);
  }
}

console.log('Total songs now:', songs.length);
console.log('Potential auto-added IDs:', autoAddedIds.size);

// Find songs that match auto-added ID pattern AND have minimal metadata
const toRemove = [];
const toKeep = [];

for (const song of songs) {
  if (autoAddedIds.has(song.id) && 
      song.pageNumber === null && 
      (!song.arranger || song.arranger.trim() === '') &&
      (!song.notes || song.notes.trim() === '')) {
    toRemove.push(song);
  } else {
    toKeep.push(song);
  }
}

console.log('\nSongs to keep:', toKeep.length);
console.log('Songs identified as auto-added:', toRemove.length);

if (toRemove.length > 0) {
  console.log('\nRemoving (first 20):');
  toRemove.slice(0, 20).forEach(s => console.log('  -', s.id));
  
  writeFileSync('src/data/songs.json', JSON.stringify(toKeep, null, 2) + '\n');
  console.log('\nSaved', toKeep.length, 'songs');
}
