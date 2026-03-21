import { readFileSync } from 'fs';

const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));
const playlists = JSON.parse(readFileSync('scripts/youtube-playlists-curated.json', 'utf8'));

const results = [];
for (const mapping of playlists.playlistBookMappings) {
  const bookSongs = songs.filter(s => s.bookId === mapping.bookId);
  const withLinks = bookSongs.filter(s => s.youtubeLinks && s.youtubeLinks.length > 0);
  const trackCount = mapping.tracks ? mapping.tracks.length : 0;
  
  const garbageSongs = bookSongs.filter(s => 
    s.title.toLowerCase().includes("and more") ||
    s.title.toLowerCase().includes("this new collection") ||
    s.title.toLowerCase().includes("this supplementary") ||
    s.title.length > 80
  );
  
  if (trackCount > 0 && withLinks.length < trackCount * 0.5) {
    results.push({
      bookId: mapping.bookId,
      songs: bookSongs.length,
      tracks: trackCount,
      matched: withLinks.length,
      garbage: garbageSongs.length,
      rate: Math.round(withLinks.length / trackCount * 100)
    });
  }
}

results.sort((a, b) => a.rate - b.rate);
console.log("Books with <50% match rate:");
results.forEach(r => {
  console.log(`  ${r.bookId}: ${r.matched}/${r.tracks} matched (${r.rate}%), ${r.garbage} garbage songs`);
});

// Show total garbage songs across all books
const allGarbage = songs.filter(s => 
  s.title.toLowerCase().includes("and more") ||
  s.title.toLowerCase().includes("this new collection") ||
  s.title.toLowerCase().includes("this supplementary") ||
  s.title.length > 80
);
console.log(`\nTotal garbage songs found: ${allGarbage.length}`);
