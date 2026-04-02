#!/usr/bin/env node
/**
 * Merge near-duplicate songs in Faber PreTime-BigTime books.
 *
 * When a book has both:
 *  - A YouTube-scraped song with YT links (longer title with movie/composer suffix)
 *  - A pianoadventures.com-sourced song without YT links (clean canonical title)
 *
 * We keep the OFFICIAL (pianoadventures.com) entry as canonical, transfer any
 * YouTube links from the scraped entry, then remove the scraped entry.
 *
 * This preserves the official song titles while retaining YouTube video links.
 */
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const SONGS_PATH = path.join(__dirname, '../src/data/songs.json');
const DRY_RUN = !process.argv.includes('--apply');

const songs = JSON.parse(readFileSync(SONGS_PATH, 'utf8'));

function strictNorm(t) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function wordNorm(t) {
  return t.toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const faberPattern = /(pretime|playtime|showtime|chordtime|funtime|bigtime)-piano/;

// Group songs by book
const byBook = {};
for (const s of songs) {
  if (!faberPattern.test(s.bookId)) continue;
  if (!byBook[s.bookId]) byBook[s.bookId] = [];
  byBook[s.bookId].push(s);
}

const idsToRemove = new Set();
const linksToTransfer = []; // { fromId, toId }
let totalMerged = 0;

for (const [bookId, bookSongs] of Object.entries(byBook)) {
  const withYt = bookSongs.filter(s => s.youtubeLinks && s.youtubeLinks.length > 0);
  const withoutYt = bookSongs.filter(s => !s.youtubeLinks || s.youtubeLinks.length === 0);

  if (withYt.length === 0 || withoutYt.length === 0) continue;

  for (const official of withoutYt) {
    // First try exact normalized match
    let scraped = withYt.find(s => strictNorm(s.title) === strictNorm(official.title));

    // Then try: official title is a prefix of scraped title (e.g. "Beauty and the Beast" matches "Beauty and the Beast (Beauty and the Beast)")
    if (!scraped) {
      const officialNorm = strictNorm(official.title);
      scraped = withYt.find(s => {
        const scrapedNorm = strictNorm(s.title);
        return scrapedNorm.startsWith(officialNorm) && scrapedNorm.length > officialNorm.length;
      });
    }

    // Try: official without "The " prefix matches scraped
    if (!scraped && official.title.startsWith('The ')) {
      const withoutThe = strictNorm(official.title.replace(/^The /, ''));
      scraped = withYt.find(s => {
        const sn = strictNorm(s.title);
        return sn.startsWith(withoutThe) && sn.length > withoutThe.length;
      });
    }

    // Try word overlap >= 80%
    if (!scraped) {
      const officialWords = wordNorm(official.title).split(' ').filter(w => w.length > 2);
      if (officialWords.length >= 2) {
        for (const yt of withYt) {
          if (idsToRemove.has(yt.id)) continue;
          const ytWords = new Set(wordNorm(yt.title).split(' ').filter(w => w.length > 2));
          const overlap = officialWords.filter(w => ytWords.has(w)).length;
          // All official words must appear in scraped title, AND official must be shorter
          if (overlap === officialWords.length && official.title.length < yt.title.length) {
            scraped = yt;
            break;
          }
        }
      }
    }

    if (scraped && !idsToRemove.has(scraped.id)) {
      console.log(`MERGE: ${bookId}`);
      console.log(`  Keep:   ${official.id} "${official.title}"`);
      console.log(`  Remove: ${scraped.id} "${scraped.title}" (${scraped.youtubeLinks.length} YT links → transferred)`);
      idsToRemove.add(scraped.id);
      linksToTransfer.push({ fromId: scraped.id, toId: official.id });
      totalMerged++;
    }
  }
}

console.log(`\nTotal merges: ${totalMerged}`);
console.log(`Songs to remove: ${idsToRemove.size}`);

if (DRY_RUN) {
  console.log('\nDry run. Run with --apply to execute.');
} else {
  // Build lookup maps
  const songById = new Map(songs.map(s => [s.id, s]));

  // Transfer YouTube links from scraped to official
  for (const { fromId, toId } of linksToTransfer) {
    const from = songById.get(fromId);
    const to = songById.get(toId);
    if (!from || !to) continue;

    if (!to.youtubeLinks) to.youtubeLinks = [];
    for (const link of from.youtubeLinks) {
      const exists = to.youtubeLinks.some(l => l.url === link.url);
      if (!exists) {
        to.youtubeLinks.push(link);
      }
    }

    // Also transfer composer/genre if official is empty
    if (!to.composer && from.composer) to.composer = from.composer;
    if (!to.genre && from.genre) to.genre = from.genre;
    if (!to.pageNumber && from.pageNumber) to.pageNumber = from.pageNumber;
    if (!to.notes && from.notes) to.notes = from.notes;
  }

  // Remove scraped duplicates
  const filtered = songs.filter(s => !idsToRemove.has(s.id));
  writeFileSync(SONGS_PATH, JSON.stringify(filtered, null, 2) + '\n');
  console.log(`\nWrote ${filtered.length} songs (removed ${songs.length - filtered.length}).`);
}
