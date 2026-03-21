import { readFileSync, writeFileSync } from 'fs';

const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));

// Find all garbage songs
const garbage = songs.filter(s => 
  s.title.toLowerCase().includes('and more') ||
  s.title.toLowerCase().includes('this new collection') ||
  s.title.toLowerCase().includes('this supplementary') ||
  s.title.toLowerCase().includes('this book includes') ||
  s.title.length > 80
);

console.log('Garbage songs to remove:', garbage.length);
garbage.forEach(s => console.log('  -', s.bookId, ':', s.title.slice(0, 60) + '...'));

// Remove them
const garbageIds = new Set(garbage.map(s => s.id));
const cleaned = songs.filter(s => !garbageIds.has(s.id));
writeFileSync('src/data/songs.json', JSON.stringify(cleaned, null, 2) + '\n');
console.log('\nRemoved', songs.length - cleaned.length, 'garbage songs');
console.log('Remaining songs:', cleaned.length);
