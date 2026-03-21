import { readFileSync, writeFileSync } from 'fs';

const CURATED_PATH = 'scripts/youtube-playlists-curated.json';
const SONGS_PATH = 'src/data/songs.json';
const BOOK_PLAYLISTS_PATH = 'src/data/book-playlists.json';
const DRY_RUN = process.argv.includes('--dry-run');

function normalizeTitle(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract the song title portion from video titles that embed book/page info
// e.g. "Faber Adult Piano Adventures All-in-One Piano Book 2, Page 22, O Sole Mio!" → "O Sole Mio!"
// e.g. "Lean On Me - Piano Adventures Level 2B ChordTime Popular Book" → "Lean On Me"
// e.g. "Theme from Finlandia - Sibelius (page 34, Adult Piano Adventures Classics Book 1)" → "Theme from Finlandia"
function extractSongFromVideoTitle(videoTitle) {
  const text = String(videoTitle || '');
  // Pattern 1: "Book Name, Page X, Song Title"
  const pageMatch = text.match(/,\s*(?:Pages?\s+\d+(?:\s+(?:and|through)\s+\d+)?),\s*(.+)$/i);
  if (pageMatch) return pageMatch[1].trim();
  // Pattern 2: "Song Title - Book Info" (e.g. Let's Play Piano Methods format)
  const dashMatch = text.match(/^(.+?)\s+-\s+(?:Piano Adventures|PlayTime|ShowTime|ChordTime|FunTime|BigTime|PreTime|Level|Alfred)/i);
  if (dashMatch) return dashMatch[1].trim();
  // Pattern 3: "Song Title - Composer (page X, Book)" (e.g. Piano Adventures Classics format)
  const composerPageMatch = text.match(/^(.+?)\s+-\s+[A-Z][a-z]+\s+\(page\s+\d+/i);
  if (composerPageMatch) return composerPageMatch[1].trim();
  // Pattern 4: "Song Title (Difficulty Piano Solo) Alfred's Adult Level N" (92PianoKeys format)
  //   – also strips trailing ", Composer" and "(RH)"/"(LH)" markers
  const alfredAdultMatch = text.match(/^(.+?)\s+\([\w-]+(?:\s+[\w-]+)*\s+Piano\s+Solo\)\s*Alfred/i);
  if (alfredAdultMatch) {
    let t = alfredAdultMatch[1].trim();
    // Remove (RH) or (LH) markers
    t = t.replace(/\s*\((?:RH|LH)\)\s*/gi, '').trim();
    return t;
  }
  // Pattern 5: "Song Title [Composer] (Easy Piano Classics - Book ...)" (Amy format)
  const amyClassicsMatch = text.match(/^(.+?)(?:\s+\[[^\]]+\])?\s+\(Easy Piano Classics/i);
  if (amyClassicsMatch) return amyClassicsMatch[1].trim();
  return null;
}

// Extract page number from video title, e.g. "(page 34, ...)" or ", Page 62," → number
function extractPageFromVideoTitle(videoTitle) {
  const text = String(videoTitle || '');
  const parenMatch = text.match(/\(page\s+(\d+)/i);
  if (parenMatch) return parseInt(parenMatch[1], 10);
  const commaMatch = text.match(/,\s*Pages?\s+(\d+)/i);
  if (commaMatch) return parseInt(commaMatch[1], 10);
  return null;
}

// Extract composer from "Song - Composer (page ...)" format (Piano Adventures)
function extractComposerFromDashTitle(videoTitle) {
  const match = String(videoTitle || '').match(/^.+?\s+-\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)\s+\(page/i);
  return match ? normalizeTitle(match[1]) : null;
}

function titleVariants(text) {
  const base = normalizeTitle(text);
  const variants = new Set([base]);
  variants.add(base.replace(/^the\s+/, ''));
  // Only strip "from ..." when preceded by "theme" or "finale" to avoid
  // collapsing distinct titles like "Theme from Finlandia" vs "Theme from Don Giovanni"
  variants.add(base.replace(/\b(theme|finale)\s+from\s+.*/, '$1').trim());
  variants.add(base.replace(/\s+op\.?\s*\d+.*/, '').trim());
  variants.add(base.replace(/\s+no\.?\s*\d+.*/, '').trim());
  // Strip "by <composer>" suffix commonly found in song titles
  variants.add(base.replace(/\s+by\s+\S.*$/, '').trim());
  // Also combine: strip "by" and "the"
  const withoutBy = base.replace(/\s+by\s+\S.*$/, '').trim();
  variants.add(withoutBy.replace(/^the\s+/, ''));
  variants.add(withoutBy.replace(/\b(theme|finale)\s+from\s+.*/, '$1').trim());
  // Strip trailing composer name after last comma (handles "Fur Elise, Beethoven" → "Fur Elise")
  const lastComma = base.lastIndexOf(',');
  if (lastComma > 0) {
    const beforeComma = base.slice(0, lastComma).trim();
    if (beforeComma.length > 3) {
      variants.add(beforeComma);
      variants.add(beforeComma.replace(/^the\s+/, ''));
    }
  }
  // Strip "themes" → "theme" singular
  variants.add(base.replace(/\bthemes\b/, 'theme'));
  // Strip "overture theme" → "overture" for matching variants
  variants.add(base.replace(/\boverture theme\b/, 'overture'));
  return [...variants].filter(Boolean);
}

function extractVideoId(url) {
  const re = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
  const match = String(url || '').match(re);
  return match?.[1] || null;
}

function canonicalYouTubeUrl(url) {
  const videoId = extractVideoId(url);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : String(url || '').trim();
}

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

// Extract composer name from brackets in video title, e.g. "[Brahms]" → "brahms"
function extractComposerFromVideoTitle(videoTitle) {
  const match = String(videoTitle || '').match(/\[([^\]]+)\]/);
  return match ? normalizeTitle(match[1]) : null;
}

function normalizeComposer(name) {
  return normalizeTitle(name).split(' ').pop() || '';
}

// Extract composer from "by Composer" at end of song title
function extractComposerFromSongTitle(title) {
  const match = String(title || '').match(/\bby\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function findSongMatchInBook(bookSongs, requestedTitle, rawVideoTitle) {
  // Try matching with the full requested title first
  const requestedVariants = new Set(titleVariants(requestedTitle));

  // If we have a raw video title, also try extracting just the song portion
  const extracted = rawVideoTitle ? extractSongFromVideoTitle(rawVideoTitle) : null;
  if (extracted) {
    for (const v of titleVariants(extracted)) requestedVariants.add(v);
  }

  const exactMatches = bookSongs.filter((song) => {
    const songVariants = titleVariants(song.title);
    return songVariants.some((variant) => requestedVariants.has(variant));
  });

  if (exactMatches.length === 1) {
    return { song: exactMatches[0], ambiguous: false };
  }

  if (exactMatches.length > 1) {
    // Strategy 1: Disambiguate using page number from video title
    const videoPage = extractPageFromVideoTitle(rawVideoTitle);
    if (videoPage) {
      const pageMatches = exactMatches.filter((song) => song.pageNumber === videoPage);
      if (pageMatches.length === 1) {
        return { song: pageMatches[0], ambiguous: false };
      }
      // Fallback: find closest page within ±5 pages (handles slight page-number discrepancies)
      const withPages = exactMatches.filter((s) => s.pageNumber);
      if (withPages.length >= 2) {
        const closest = withPages.reduce((best, s) =>
          Math.abs(s.pageNumber - videoPage) < Math.abs(best.pageNumber - videoPage) ? s : best
        );
        if (Math.abs(closest.pageNumber - videoPage) <= 5) {
          const tiedCount = withPages.filter((s) =>
            Math.abs(s.pageNumber - videoPage) === Math.abs(closest.pageNumber - videoPage)
          ).length;
          if (tiedCount === 1) {
            return { song: closest, ambiguous: false };
          }
        }
      }
    }

    // Strategy 2: Disambiguate using composer from video title brackets [Composer]
    const videoComposer = extractComposerFromVideoTitle(rawVideoTitle)
      || extractComposerFromDashTitle(rawVideoTitle);
    if (videoComposer) {
      const videoLastName = normalizeComposer(videoComposer);
      const composerMatches = exactMatches.filter((song) => {
        // Check the explicit composer field first, then extract from title "by ..." suffix
        const composerSource = song.composer || extractComposerFromSongTitle(song.title) || '';
        const songLastName = normalizeComposer(composerSource);
        return songLastName === videoLastName || normalizeTitle(composerSource).includes(videoComposer);
      });
      if (composerMatches.length === 1) {
        return { song: composerMatches[0], ambiguous: false };
      }
    }
    return { song: null, ambiguous: true };
  }

  return { song: null, ambiguous: false };
}

function applyLinkToSong(song, channelName, url, description, playlistId, playlistUrl) {
  const canonicalUrl = canonicalYouTubeUrl(url);
  if (!canonicalUrl) {
    return false;
  }

  if (!Array.isArray(song.youtubeLinks)) {
    song.youtubeLinks = [];
  }

  const exists = song.youtubeLinks.some((link) => canonicalYouTubeUrl(link.url) === canonicalUrl);
  if (exists) {
    return false;
  }

  const linkObj = {
    url: canonicalUrl,
    artist: channelName,
    description: description || '',
  };
  
  if (playlistId) {
    linkObj.playlistId = playlistId;
    linkObj.playlistUrl = playlistUrl || `https://www.youtube.com/playlist?list=${playlistId}`;
  }
  
  song.youtubeLinks.push(linkObj);
  return true;
}

function main() {
  const curated = loadJson(CURATED_PATH);
  const songs = loadJson(SONGS_PATH);

  const channelsById = new Map((curated.channels || []).map((channel) => [channel.id, channel]));
  const songsById = new Map(songs.map((song) => [song.id, song]));
  const songsByBookId = new Map();

  for (const song of songs) {
    if (!songsByBookId.has(song.bookId)) {
      songsByBookId.set(song.bookId, []);
    }
    songsByBookId.get(song.bookId).push(song);
  }

  let linksAdded = 0;
  let linksSkipped = 0;
  const unmatched = [];
  const ambiguous = [];

  const directEntries = curated.directSongLinks || [];
  for (const entry of directEntries) {
    const channel = channelsById.get(entry.channelId);
    const artist = entry.artist || channel?.name || 'Unknown Channel';

    let targetSong = null;

    if (entry.songId) {
      targetSong = songsById.get(entry.songId) || null;
    } else if (entry.bookId && entry.songTitle) {
      const bookSongs = songsByBookId.get(entry.bookId) || [];
      const { song, ambiguous: isAmbiguous } = findSongMatchInBook(bookSongs, entry.songTitle);
      if (isAmbiguous) {
        ambiguous.push({ source: 'directSongLinks', ...entry });
        continue;
      }
      targetSong = song;
    }

    if (!targetSong) {
      unmatched.push({ source: 'directSongLinks', ...entry });
      continue;
    }

    if (applyLinkToSong(targetSong, artist, entry.url, entry.description, entry.playlistId, entry.playlistUrl)) {
      linksAdded += 1;
    } else {
      linksSkipped += 1;
    }
  }

  const playlistEntries = curated.playlistBookMappings || [];
  for (const playlist of playlistEntries) {
    const channel = channelsById.get(playlist.channelId);
    const artist = channel?.name || playlist.channelName || 'Unknown Channel';
    const bookSongs = songsByBookId.get(playlist.bookId) || [];

    if (bookSongs.length === 0) {
      unmatched.push({
        source: 'playlistBookMappings',
        reason: 'book-not-found',
        bookId: playlist.bookId,
        playlistTitle: playlist.playlistTitle,
      });
      continue;
    }

    const tracks = playlist.tracks || [];
    for (const track of tracks) {
      const { song, ambiguous: isAmbiguous } = findSongMatchInBook(bookSongs, track.songTitle || track.videoTitle, track.videoTitle);

      if (isAmbiguous) {
        ambiguous.push({
          source: 'playlistBookMappings',
          bookId: playlist.bookId,
          playlistTitle: playlist.playlistTitle,
          ...track,
        });
        continue;
      }

      if (!song) {
        unmatched.push({
          source: 'playlistBookMappings',
          bookId: playlist.bookId,
          playlistTitle: playlist.playlistTitle,
          ...track,
        });
        continue;
      }

      if (applyLinkToSong(song, artist, track.url, track.description || playlist.playlistTitle || '', playlist.playlistId, playlist.playlistUrl)) {
        linksAdded += 1;
      } else {
        linksSkipped += 1;
      }
    }
  }

  const summary = {
    dryRun: DRY_RUN,
    linksAdded,
    linksSkipped,
    unmatchedCount: unmatched.length,
    ambiguousCount: ambiguous.length,
  };

  console.log('[yt:link] Summary');
  console.log(JSON.stringify(summary, null, 2));

  if (unmatched.length > 0) {
    console.log('\n[yt:link] Unmatched entries (first 20)');
    console.log(JSON.stringify(unmatched.slice(0, 20), null, 2));
  }

  if (ambiguous.length > 0) {
    console.log('\n[yt:link] Ambiguous entries (first 20)');
    console.log(JSON.stringify(ambiguous.slice(0, 20), null, 2));
  }

  if (!DRY_RUN) {
    writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2) + '\n', 'utf8');
    console.log(`\n[yt:link] Updated ${SONGS_PATH}`);

    // Auto-generate book-playlists.json from curated playlistBookMappings
    const bookPlaylists = playlistEntries.map((p) => {
      const channel = channelsById.get(p.channelId);
      return {
        bookId: p.bookId,
        playlistId: p.playlistId,
        playlistTitle: p.playlistTitle,
        playlistUrl: p.playlistUrl || `https://www.youtube.com/playlist?list=${p.playlistId}`,
        channelName: channel?.name || p.channelName || 'Unknown Channel',
        trackCount: (p.tracks || []).length,
      };
    });
    writeFileSync(BOOK_PLAYLISTS_PATH, JSON.stringify(bookPlaylists, null, 2) + '\n', 'utf8');
    console.log(`[yt:link] Updated ${BOOK_PLAYLISTS_PATH}`);
  } else {
    console.log('\n[yt:link] Dry run complete. No files were written.');
  }
}

main();
