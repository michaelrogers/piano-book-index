import { readFileSync, writeFileSync } from 'fs';

const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));
const playlists = JSON.parse(readFileSync('scripts/youtube-playlists-curated.json', 'utf8'));
const books = JSON.parse(readFileSync('src/data/books.json', 'utf8'));

function normalizeTitle(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')   // Remove (parentheses)
    .replace(/\[[^\]]*\]/g, ' ')   // Remove [brackets]
    .replace(/[^a-z0-9\s]/g, ' ')  // Keep only alphanumeric
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSongTitle(videoTitle) {
  // Remove channel suffix like "(BigTime Piano Popular)"
  let title = videoTitle.replace(/\s*\([^)]*Piano[^)]*\)\s*$/i, '');
  // Extract artist from brackets
  const artistMatch = title.match(/\[([^\]]+)\]/);
  const artist = artistMatch ? artistMatch[1] : '';
  // Remove brackets
  title = title.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();
  return { title, artist };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// For each book with playlist, find missing songs
let totalAdded = 0;
for (const mapping of playlists.playlistBookMappings) {
  const book = books.find(b => b.id === mapping.bookId);
  if (!book) continue;
  
  const bookSongs = songs.filter(s => s.bookId === mapping.bookId);
  const bookSongNorms = new Set(bookSongs.map(s => normalizeTitle(s.title)));
  
  const missingSongs = [];
  for (const track of (mapping.tracks || [])) {
    const { title, artist } = extractSongTitle(track.videoTitle);
    const norm = normalizeTitle(title);
    
    if (!bookSongNorms.has(norm)) {
      // Check if any existing song partially matches
      const partialMatch = bookSongs.some(s => {
        const songNorm = normalizeTitle(s.title);
        return songNorm.includes(norm) || norm.includes(songNorm);
      });
      
      if (!partialMatch) {
        missingSongs.push({ title, artist, videoTitle: track.videoTitle });
      }
    }
  }
  
  if (missingSongs.length > 0) {
    console.log(`\n${mapping.bookId}: ${missingSongs.length} missing songs`);
    
    for (const missing of missingSongs) {
      const songId = `${mapping.bookId}-${slugify(missing.title)}`;
      
      // Check if this ID already exists
      if (songs.some(s => s.id === songId)) {
        console.log(`  - SKIP (exists): ${missing.title}`);
        continue;
      }
      
      const newSong = {
        id: songId,
        title: missing.title,
        composer: missing.artist || 'Various',
        arranger: '',
        genre: 'Popular',
        bookId: mapping.bookId,
        pageNumber: null,
        difficulty: {
          label: 'Late Intermediate',  // BigTime level
          faberLevel: 'Level 4',
          alfredLevel: null
        },
        youtubeLinks: [],
        notes: ''
      };
      
      // Adjust difficulty based on book series
      if (mapping.bookId.includes('pretime')) {
        newSong.difficulty = { label: 'Beginner', faberLevel: 'Primer', alfredLevel: null };
      } else if (mapping.bookId.includes('playtime')) {
        newSong.difficulty = { label: 'Beginner', faberLevel: 'Level 1', alfredLevel: null };
      } else if (mapping.bookId.includes('showtime')) {
        newSong.difficulty = { label: 'Early Intermediate', faberLevel: 'Level 2A', alfredLevel: null };
      } else if (mapping.bookId.includes('chordtime')) {
        newSong.difficulty = { label: 'Intermediate', faberLevel: 'Level 2B', alfredLevel: null };
      } else if (mapping.bookId.includes('funtime')) {
        newSong.difficulty = { label: 'Intermediate', faberLevel: 'Level 3A-3B', alfredLevel: null };
      } else if (mapping.bookId.includes('bigtime')) {
        newSong.difficulty = { label: 'Late Intermediate', faberLevel: 'Level 4', alfredLevel: null };
      }
      
      // Adjust genre based on book
      if (mapping.bookId.includes('christmas')) {
        newSong.genre = 'Christmas';
      } else if (mapping.bookId.includes('classics')) {
        newSong.genre = 'Classical';
      } else if (mapping.bookId.includes('disney')) {
        newSong.genre = 'Disney';
      } else if (mapping.bookId.includes('jazz') || mapping.bookId.includes('blues')) {
        newSong.genre = 'Jazz/Blues';
      } else if (mapping.bookId.includes('rock')) {
        newSong.genre = 'Rock';
      } else if (mapping.bookId.includes('kids')) {
        newSong.genre = "Kids' Songs";
      }
      
      songs.push(newSong);
      totalAdded++;
      console.log(`  + ADD: ${missing.title}`);
    }
  }
}

if (totalAdded > 0) {
  writeFileSync('src/data/songs.json', JSON.stringify(songs, null, 2) + '\n');
  console.log(`\nAdded ${totalAdded} new songs from playlist data`);
} else {
  console.log('\nNo new songs to add');
}
