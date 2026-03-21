#!/usr/bin/env node
/**
 * Reports YouTube link coverage per book.
 * Usage: node scripts/coverage-report.mjs [--missing] [--book <id>]
 *   --missing   Show titles of songs without YouTube links
 *   --book <id> Filter to a specific book
 */
import { readFileSync } from 'fs';

const books = JSON.parse(readFileSync('src/data/books.json', 'utf8'));
const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));

const showMissing = process.argv.includes('--missing');
const bookFilter = process.argv.includes('--book')
  ? process.argv[process.argv.indexOf('--book') + 1]
  : null;

const bookMap = new Map(books.map((b) => [b.id, b]));
const songsByBook = new Map();
for (const s of songs) {
  if (!songsByBook.has(s.bookId)) songsByBook.set(s.bookId, []);
  songsByBook.get(s.bookId).push(s);
}

let totalSongs = 0;
let totalWithLinks = 0;
const rows = [];

for (const [bookId, bookSongs] of songsByBook) {
  if (bookFilter && bookId !== bookFilter) continue;
  const book = bookMap.get(bookId);
  const withLinks = bookSongs.filter((s) => s.youtubeLinks?.length > 0);
  const count = bookSongs.length;
  const linked = withLinks.length;
  const pct = count ? Math.round((linked / count) * 100) : 0;
  totalSongs += count;
  totalWithLinks += linked;

  rows.push({ bookId, title: book?.title || bookId, count, linked, pct });

  if (showMissing && linked < count) {
    const missing = bookSongs.filter((s) => !s.youtubeLinks?.length);
    rows.push({ missing: missing.map((s) => `  - ${s.title} (p${s.pageNumber || '?'})`) });
  }
}

// Sort by coverage ascending (lowest first)
const dataRows = rows.filter((r) => !r.missing);
const missingRows = new Map();
for (let i = 0; i < rows.length; i++) {
  if (rows[i].missing) {
    // Attach to the previous data row
    const prev = rows[i - 1];
    if (prev?.bookId) missingRows.set(prev.bookId, rows[i].missing);
  }
}
dataRows.sort((a, b) => a.pct - b.pct);

// Print table
console.log('');
console.log('Book'.padEnd(50) + 'Songs'.padStart(7) + 'Linked'.padStart(8) + 'Coverage'.padStart(10));
console.log('-'.repeat(75));

for (const r of dataRows) {
  const bar = r.pct === 100 ? '  ✅' : r.pct === 0 ? '  ⬜' : '';
  console.log(
    r.title.slice(0, 49).padEnd(50) +
    String(r.count).padStart(7) +
    String(r.linked).padStart(8) +
    `${r.pct}%`.padStart(9) + bar
  );
  if (showMissing && missingRows.has(r.bookId)) {
    for (const line of missingRows.get(r.bookId)) console.log(line);
  }
}

const totalPct = totalSongs ? Math.round((totalWithLinks / totalSongs) * 100) : 0;
console.log('-'.repeat(75));
console.log(
  'TOTAL'.padEnd(50) +
  String(totalSongs).padStart(7) +
  String(totalWithLinks).padStart(8) +
  `${totalPct}%`.padStart(9)
);
console.log('');
