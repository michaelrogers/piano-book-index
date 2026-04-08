#!/usr/bin/env node
/**
 * One-time script: Populate amazon-verified.json from manual analysis of
 * verify-amazon-links.mjs output. Uses ISBN-10 ASINs for books confirmed
 * to point to the correct Amazon product.
 *
 * Excludes books where ISBN→ASIN leads to a wrong product, 404, or no ISBN.
 */

import { readFileSync, writeFileSync } from 'fs';

const booksPath = new URL('../src/data/books.json', import.meta.url);
const verifiedPath = new URL('../src/data/amazon-verified.json', import.meta.url);
const books = JSON.parse(readFileSync(booksPath, 'utf-8'));

function isbn13to10(isbn13) {
  const clean = isbn13.replace(/[-\s]/g, '');
  if (clean.length !== 13 || !clean.startsWith('978')) return null;
  const digits9 = clean.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits9[i], 10) * (10 - i);
  }
  const remainder = (11 - (sum % 11)) % 11;
  const checkDigit = remainder === 10 ? 'X' : String(remainder);
  return digits9 + checkDigit;
}

// Books where ISBN→ASIN leads to a WRONG Amazon product (verified manually)
const WRONG_PRODUCT = new Set([
  'faber-jazz-1',          // → Manuscript Book
  'faber-pop-1',           // → Technique & Artistry Level 4
  'faber-pop-2',           // → Sightreading Level 1
  'faber-motown-hits',     // → Sightreading 2A
  'faber-country-hits',    // → Sightreading 2B
  'faber-standards-1',     // → PreTime Studio Collection
  'alfred-greatest-hits-2', // → Group Piano Course Bk 4
  'alfred-popular-hits-1', // → Suzuki Flute School
  'alfred-popular-hits-3', // → Suzuki Voice School
  'alfred-greatest-hits-3', // → Group Piano Course Teacher's Handbook
]);

// Books with HTTP 404 or no ISBN
const ERRORS = new Set([
  'faber-jazz-2',          // HTTP 404
  'alfred-popular-hits-2', // HTTP 404
  'funtime-piano-rock-n-roll', // No ISBN
]);

// Amazon titles from the verification run (for the record)
const AMAZON_TITLES = {
  'faber-lesson-1': "Adult Piano Adventures: All in One Course - Book 1 | Faber Beginner Method Piano Book for Adults with Chords and Music Notation | Piano Sheet Music and Theory for Self Learners With Digital Audio",
  'faber-lesson-2': "Adult Piano Adventures: All-in-One Piano Course - Book 2 | Early Intermediate Piano Method with Online Audio | Songbook with Sheet Music and Theory for Adults | Faber Piano Book for Chord Playing",
  'faber-classics-1': "Adult Piano Adventures Classics Book 1",
  'faber-classics-2': "Adult Piano Adventures Classics Book 2",
  'faber-popular-1': "Adult Piano Adventures Popular Book 1",
  'faber-popular-2': "Adult Piano Adventures Popular Book 2",
  'faber-christmas-1': "Adult Piano Adventures Christmas Book 1",
  'faber-christmas-2': "Adult Piano Adventures Christmas Book 2",
  'alfred-greatest-hits-1': "Alfred's Basic Adult Piano Course: Greatest Hits Book 1",
  'pretime-piano-christmas': "PreTime Piano: Christmas - Primer Level",
  'pretime-piano-classics': "PreTime Piano: Classics - Primer Level",
  'pretime-piano-disney': "PreTime Piano: Disney - Primer Level",
  'pretime-piano-favorites': "PreTime Piano: Favorites - Primer Level",
  'pretime-piano-hymns': "PreTime Piano: Hymns - Primer Level",
  'pretime-piano-jazz-blues': "PreTime Piano: Jazz and Blues - Primer Level",
  'pretime-piano-kids-songs': "PreTime Piano: Kids Songs - Primer Level",
  'pretime-piano-music-from-china': "PreTime Piano: Music from China - Primer Level",
  'pretime-piano-popular': "PreTime Piano: Popular - Primer Level",
  'pretime-piano-rock-n-roll': "PreTime Piano: Rock 'n Roll - Primer Level",
  'pretime-piano-faber-studio-collection': "Faber Studio Collection: Selections from PreTime Piano - Primer Level",
  'playtime-piano-christmas': "PlayTime Piano: Christmas - Level 1",
  'playtime-piano-classics': "PlayTime Piano: Classics - Level 1",
  'playtime-piano-disney': "PlayTime Piano: Disney - Level 1",
  'playtime-piano-favorites': "PlayTime Piano: Favorites - Level 1",
  'playtime-piano-hymns': "PlayTime Piano: Hymns - Level 1",
  'playtime-piano-jazz-blues': "PlayTime Piano: Jazz and Blues - Level 1",
  'playtime-piano-kids-songs': "PlayTime Piano: Kids Songs - Level 1",
  'playtime-piano-music-from-china': "PlayTime Piano: Music from China - Level 1",
  'playtime-piano-popular': "PlayTime Piano: Popular - Level 1",
  'playtime-piano-rock-n-roll': "PlayTime Piano: Rock n Roll - Level 1",
  'playtime-piano-faber-studio-collection': "Faber Studio Collection: Selections from PlayTime Piano - Level 1",
  'showtime-piano-christmas': "ShowTime Piano: Christmas - Level 2A",
  'showtime-piano-classics': "ShowTime Piano: Classics - Level 2A",
  'showtime-piano-disney': "ShowTime Piano: Disney - Level 2A",
  'showtime-piano-favorites': "ShowTime Piano: Favorites - Level 2A",
  'showtime-piano-hits': "ShowTime Piano: Hits - Level 2A",
  'showtime-piano-hymns': "ShowTime Piano: Hymns - Level 2A",
  'showtime-piano-jazz-blues': "ShowTime Piano: Jazz & Blues - Level 2A",
  'showtime-piano-kids-songs': "ShowTime Piano: Kids Songs - Level 2A",
  'showtime-piano-music-from-china': "ShowTime Piano: Music from China - Level 2A",
  'showtime-piano-popular': "ShowTime Piano: Popular - Level 2A",
  'showtime-piano-rock-n-roll': "ShowTime Piano: Rock 'n Roll - Level 2A",
  'showtime-piano-faber-studio-collection': "Faber Studio Collection: Selections from ShowTime Piano - Level 2A",
  'chordtime-piano-christmas': "ChordTime Piano: Christmas - Level 2B",
  'chordtime-piano-classics': "ChordTime Piano: Classics - Level 2B",
  'chordtime-piano-disney': "ChordTime Piano: Disney - Level 2B",
  'chordtime-piano-favorites': "ChordTime Piano: Favorites - Level 2B",
  'chordtime-piano-hits': "ChordTime Piano: Hits - Level 2B",
  'chordtime-piano-hymns': "ChordTime Piano: Hymns - Level 2B",
  'chordtime-piano-jazz-blues': "ChordTime Piano: Jazz & Blues - Level 2B",
  'chordtime-piano-jewish-favorites': "ChordTime Piano: Jewish Favorites - Level 2B",
  'chordtime-piano-kids-songs': "ChordTime Piano Kids' Songs - Level 2B",
  'chordtime-piano-music-from-china': "ChordTime Piano: Music from China - Level 2B",
  'chordtime-piano-popular': "ChordTime Piano: Popular - Level 2B",
  'chordtime-piano-ragtime-marches': "ChordTime Piano: Ragtime and Marches - Level 2B",
  'chordtime-piano-rock-n-roll': "ChordTime Piano Rock 'n' Roll - Level 2B",
  'chordtime-piano-faber-studio-collection': "Faber Studio Collection: Selections from ChordTime Piano - Level 2B",
  'funtime-piano-christmas': "FunTime Piano: Christmas - Level 3A 3B",
  'funtime-piano-classics': "FunTime Piano: Classics - Level 3A 3B",
  'funtime-piano-disney': "FunTime Piano: Disney - Level 3A 3B",
  'funtime-piano-favorites': "FunTime Piano: Favorites - Level 3A 3B",
  'funtime-piano-hits': "FunTime Piano: Hits - Level 3A 3B",
  'funtime-piano-hymns': "FunTime Piano: Hymns - Level 3A 3B",
  'funtime-piano-jazz-blues': "FunTime Piano: Jazz and Blues - Level 3A 3B",
  'funtime-piano-kids-songs': "FunTime Piano: Kids' Songs Level 3A-3B",
  'funtime-piano-music-from-china': "FunTime Piano: Music from China - Level 3A 3B",
  'funtime-piano-popular': "FunTime Piano: Popular - Level 3A 3B",
  'funtime-piano-ragtime-marches': "FunTime Piano: Ragtime and Marches - Level 3A 3B",
  'funtime-piano-faber-studio-collection': "Faber Studio Collection: Selection from FunTime Piano - Level 3A 3B",
  'bigtime-piano-christmas': "BigTime Piano: Christmas - Level 4",
  'bigtime-piano-classics': "BigTime Piano: Classics - Level 4",
  'bigtime-piano-disney': "BigTime Piano: Disney - Level 4",
  'bigtime-piano-favorites': "BigTime Piano: Favorites - Level 4",
  'bigtime-piano-hits': "BigTime Piano: Hits - Level 4",
  'bigtime-piano-hymns': "BigTime Piano: Hymns - Level 4",
  'bigtime-piano-jazz-blues': "BigTime Piano: Jazz & Blues - Level 4 and Above",
  'bigtime-piano-kids-songs': "BigTime Piano: Kids' Songs - Level 4",
  'bigtime-piano-music-from-china': "BigTime Piano: Music from China - Level 4",
  'bigtime-piano-popular': "BigTime Piano: Popular - Level 4 and Above",
  'bigtime-piano-ragtime-marches': "BigTime Piano: Ragtime and Marches - Level 4",
  'bigtime-piano-rock-n-roll': "BigTime Piano: Rock 'n' Roll - Level 4",
  'bigtime-piano-faber-studio-collection': "Faber Studio Collection: Selections from BigTime Piano - Level 4",
  'advancetime-piano-christmas': "AdvanceTime Piano: Christmas Book - Level 5",
  'library-of-easy-piano-classics': "The Library of Easy Piano Classics",
  'alfred-adult-aio-1': "Adult All-In-One Course: Lesson-Theory-Technic: Level 1",
  'alfred-adult-aio-2': "Adult All-in-one Course: Alfred's Basic Adult Piano Course, Level 2",
  'alfred-adult-aio-3': "Adult All-in-One Course: lesson, theory, solo. Level 3",
  'library-family-singalongs': "The Library of Family Singalongs",
};

const today = new Date().toISOString().slice(0, 10);
const verified = { books: [] };

for (const book of books) {
  if (WRONG_PRODUCT.has(book.id) || ERRORS.has(book.id)) continue;
  if (!book.isbn) continue;

  const isbn10 = isbn13to10(book.isbn);
  if (!isbn10) continue;

  const amazonTitle = AMAZON_TITLES[book.id] || book.title;

  verified.books.push({
    bookId: book.id,
    asin: isbn10,
    expectedTitle: book.title,
    amazonTitle,
    verifiedAt: today,
    verifiedMethod: 'manual-review',
  });
}

verified.books.sort((a, b) => a.bookId.localeCompare(b.bookId));
writeFileSync(verifiedPath, JSON.stringify(verified, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${verified.books.length} verified entries to amazon-verified.json`);

// List excluded books
const excludedWrong = books.filter((b) => WRONG_PRODUCT.has(b.id));
const excludedError = books.filter((b) => ERRORS.has(b.id));
console.log(`\nExcluded (wrong product): ${excludedWrong.length}`);
for (const b of excludedWrong) console.log(`  - ${b.id}: ${b.title}`);
console.log(`Excluded (error/no ISBN): ${excludedError.length}`);
for (const b of excludedError) console.log(`  - ${b.id}: ${b.title}`);
