import { readFileSync } from 'fs';

const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));
const playlists = JSON.parse(readFileSync('scripts/youtube-playlists-curated.json', 'utf8'));

const bookId = 'bigtime-piano-popular';
const bookSongs = songs.filter(s => s.bookId === bookId);
const withLinks = bookSongs.filter(s => s.youtubeLinks && s.youtubeLinks.length > 0);
const mapping = playlists.playlistBookMappings.find(m => m.bookId === bookId);

console.log('Current state:', withLinks.length, '/', mapping.tracks.length, 'matched');

console.log('\n--- Songs with links ---');
withLinks.forEach(s => console.log(' ✓', s.title));

console.log('\n--- Songs without links ---');
bookSongs.filter(s => !s.youtubeLinks || s.youtubeLinks.length === 0).forEach(s => console.log(' ✗', s.title));

console.log('\n--- Unmatched videos ---');
const matchedUrls = new Set(withLinks.flatMap(s => s.youtubeLinks.map(l => l.url)));
mapping.tracks.filter(t => !matchedUrls.has(t.url)).forEach(t => console.log(' ?', t.videoTitle));
