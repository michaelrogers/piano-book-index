#!/usr/bin/env node
/**
 * Updates songs.json for Alfred Adult AIO books with data scraped from 92PianoKeys descriptions:
 * - Page numbers
 * - Per-song difficulty from video titles
 * - Composer/arranger from descriptions where better than existing
 * - Key signature and time signature as notes
 * Then reorders songs within each AIO book by page number.
 */
import { readFileSync, writeFileSync } from 'fs';

const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));
const scraped = JSON.parse(readFileSync('/tmp/alfred-video-descriptions.json', 'utf8'));

const AIO_BOOK_IDS = ['alfred-adult-aio-1', 'alfred-adult-aio-2', 'alfred-adult-aio-3'];

// Map 92PianoKeys difficulty labels to our DifficultyLabel type
const DIFF_MAP = {
  'Elementary': 'Beginner',
  'Early-Intermediate': 'Early Intermediate',
  'Intermediate': 'Intermediate',
  'Late-Intermediate': 'Late Intermediate',
  'Early-Advanced': 'Early Advanced',
};

// Normalize a title for matching purposes
function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics (é→e)
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate title variants for fuzzy matching
function titleVariants(title) {
  const base = normalize(title);
  const variants = [base];
  // Strip "from ..." subtitle
  const fromIdx = base.indexOf(' from ');
  if (fromIdx > 0) variants.push(base.substring(0, fromIdx).trim());
  // Strip trailing composer after last comma (pre-normalize)
  const rawCommaIdx = title.lastIndexOf(',');
  if (rawCommaIdx > 5) {
    variants.push(normalize(title.substring(0, rawCommaIdx)));
  }
  // Also strip at first comma for multi-comma titles like "Etude, Op. 10, No. 3, Chopin"
  const rawFirstComma = title.indexOf(',');
  if (rawFirstComma > 2 && rawFirstComma !== rawCommaIdx) {
    variants.push(normalize(title.substring(0, rawFirstComma)));
  }
  // Remove possessive ' s ' → ' '
  if (base.includes(' s ')) variants.push(base.replace(/ s /g, ' '));
  // Handle marines/marine, etc
  if (base.includes('marines')) variants.push(base.replace(/marines/g, 'marine'));
  if (base.includes('marine ')) variants.push(base.replace(/marine /g, 'marines '));
  // swingin/swinging etc
  if (base.includes('ing ')) variants.push(base.replace(/ing /g, "in "));
  if (base.includes("in ")) variants.push(base.replace(/\bin(\s)/g, "ing$1"));
  // Handle ev rything → everything, etc
  variants.push(base.replace(/ev ry/g, 'every'));
  return [...new Set(variants)];
}

// Extract clean song name from 92PianoKeys video title
function extractSongName(title) {
  return title
    .replace(/\s*\([^)]*Piano Solo\).*$/i, '')
    .replace(/\s*\((?:RH|LH)\)/gi, '')
    .trim();
}

// Build a lookup from video data per book
// Key: normalized song title, Value: scraped entry
function buildLookup(entries) {
  const lookup = new Map();
  for (const entry of entries) {
    const name = extractSongName(entry.title);
    const keys = titleVariants(name);
    for (const key of keys) {
      // If duplicate, keep the first one with a page number
      if (!lookup.has(key) || (!lookup.get(key).pageNumber && entry.pageNumber)) {
        lookup.set(key, entry);
      }
    }
  }
  return lookup;
}

// Build notes string from extra metadata
function buildNotes(entry, existingNotes) {
  const parts = [];
  if (entry.key) parts.push(`Key: ${entry.key}`);
  if (entry.timeSignature) parts.push(`Time: ${entry.timeSignature}`);
  
  // Merge with existing notes
  if (existingNotes && existingNotes.trim()) {
    parts.push(existingNotes.trim());
  }
  return parts.join('. ');
}

let updatedCount = 0;
let pageSet = 0;
let diffUpdated = 0;
let composerUpdated = 0;
let notesUpdated = 0;

for (const bookId of AIO_BOOK_IDS) {
  const bookEntries = scraped[bookId];
  if (!bookEntries) {
    console.log(`No scraped data for ${bookId}`);
    continue;
  }
  
  const lookup = buildLookup(bookEntries);
  console.log(`\n=== ${bookId}: ${lookup.size} unique video titles ===`);
  
  const bookSongs = songs.filter(s => s.bookId === bookId);
  let matched = 0;
  let unmatched = [];
  
  for (const song of bookSongs) {
    const songVariants = titleVariants(song.title);
    let entry = null;
    
    // Try direct match with all song title variants
    for (const v of songVariants) {
      if (lookup.has(v)) { entry = lookup.get(v); break; }
    }
    
    // Try removing parenthetical from song title
    if (!entry) {
      const withoutParen = normalize(song.title.replace(/\s*\([^)]*\)/, ''));
      entry = lookup.get(withoutParen);
    }
    
    // Try matching song variants against scraped variants (substring, min 8 chars)
    if (!entry) {
      for (const [scraKey, scraEntry] of lookup) {
        const scraVariants = [scraKey];
        const ci = scraKey.lastIndexOf(',');
        if (ci > 5) scraVariants.push(scraKey.substring(0, ci).trim());
        
        for (const sv of songVariants) {
          if (sv.length < 8) continue; // avoid short substring false positives
          for (const scv of scraVariants) {
            if (scv.length < 8) continue;
            if (sv === scv || sv.includes(scv) || scv.includes(sv)) {
              entry = scraEntry;
              break;
            }
          }
          if (entry) break;
        }
        if (entry) break;
      }
    }
    
    if (!entry) {
      unmatched.push(song.title);
      continue;
    }
    
    matched++;
    let updated = false;
    
    // Update page number
    if (entry.pageNumber && !song.pageNumber) {
      song.pageNumber = entry.pageNumber;
      pageSet++;
      updated = true;
    }
    
    // Update per-song difficulty from 92PianoKeys rating
    if (entry.difficulty && DIFF_MAP[entry.difficulty]) {
      const newLabel = DIFF_MAP[entry.difficulty];
      if (song.difficulty.label !== newLabel) {
        song.difficulty.label = newLabel;
        diffUpdated++;
        updated = true;
      }
    }
    
    // Update composer if we have a better one from description
    if (entry.composer && (!song.composer || song.composer === 'Unknown' || song.composer === 'Traditional')) {
      // Only override "Traditional" or "Unknown" with a specific composer
      // Don't override if existing is more specific
      const newComposer = entry.composer.trim();
      if (newComposer && newComposer.length > 2) {
        song.composer = newComposer;
        composerUpdated++;
        updated = true;
      }
    }
    
    // Add key/time signature to notes
    const newNotes = buildNotes(entry, song.notes);
    if (newNotes !== song.notes) {
      song.notes = newNotes;
      notesUpdated++;
      updated = true;
    }
    
    if (updated) updatedCount++;
  }
  
  console.log(`  Matched: ${matched}/${bookSongs.length}`);
  if (unmatched.length) {
    console.log(`  Unmatched (${unmatched.length}):`);
    unmatched.forEach(t => console.log(`    - ${t}`));
  }
}

// Reorder songs: AIO books by page number, others unchanged
console.log('\n=== Reordering songs by page number ===');
const aioSongs = new Map();
const otherSongs = [];
const songOrder = []; // track original book ordering

for (const song of songs) {
  if (AIO_BOOK_IDS.includes(song.bookId)) {
    if (!aioSongs.has(song.bookId)) aioSongs.set(song.bookId, []);
    aioSongs.get(song.bookId).push(song);
  } else {
    otherSongs.push(song);
  }
}

// Sort each AIO book's songs by page number (null pages go to end)
for (const [bookId, bookSongs] of aioSongs) {
  bookSongs.sort((a, b) => {
    const pa = a.pageNumber ?? 9999;
    const pb = b.pageNumber ?? 9999;
    if (pa !== pb) return pa - pb;
    return a.title.localeCompare(b.title);
  });
  console.log(`  ${bookId}: ${bookSongs.filter(s => s.pageNumber).length} with page, ${bookSongs.filter(s => !s.pageNumber).length} without`);
}

// Rebuild songs array: keep non-AIO songs in original order, insert AIO books where they appeared
const result = [];
const insertedBooks = new Set();
for (const song of songs) {
  if (AIO_BOOK_IDS.includes(song.bookId)) {
    if (!insertedBooks.has(song.bookId)) {
      insertedBooks.add(song.bookId);
      result.push(...aioSongs.get(song.bookId));
    }
    // Skip individual AIO songs (already inserted as sorted block)
  } else {
    result.push(song);
  }
}

writeFileSync('src/data/songs.json', JSON.stringify(result, null, 2) + '\n');

console.log(`\n=== Summary ===`);
console.log(`  Songs updated: ${updatedCount}`);
console.log(`  Page numbers set: ${pageSet}`);
console.log(`  Difficulty updated: ${diffUpdated}`);
console.log(`  Composer updated: ${composerUpdated}`);
console.log(`  Notes updated: ${notesUpdated}`);
console.log(`  Total songs: ${result.length}`);
