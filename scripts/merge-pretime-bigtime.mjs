#!/usr/bin/env node
/**
 * Merge scraped PreTime-to-BigTime data into the main books.json and songs.json
 */
import { readFileSync, writeFileSync } from 'fs';

// Load existing data
const existingBooks = JSON.parse(readFileSync('src/data/books.json', 'utf8'));
const existingSongs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));

// Load scraped data
const newBooks = JSON.parse(readFileSync('scripts/pretime-bigtime-books.json', 'utf8'));
const newSongs = JSON.parse(readFileSync('scripts/pretime-bigtime-songs.json', 'utf8'));

// Clean up the scraped books for the final format (remove internal fields)
const cleanedBooks = newBooks.map(b => ({
  id: b.id,
  title: b.title,
  series: b.series,
  seriesLevel: b.seriesLevel,
  bookType: b.bookType,
  publisher: b.publisher,
  isbn: b.isbn,
  coverImage: b.coverImage,
  pageCount: b.pageCount,
  description: b.description,
  amazonUrl: b.amazonUrl,
}));

// Merge books - add new ones, don't overwrite existing
const existingBookIds = new Set(existingBooks.map(b => b.id));
const mergedBooks = [...existingBooks];
for (const book of cleanedBooks) {
  if (!existingBookIds.has(book.id)) {
    mergedBooks.push(book);
  }
}

// Merge songs - add new ones, don't overwrite existing
const existingSongIds = new Set(existingSongs.map(s => s.id));
const mergedSongs = [...existingSongs];
let dupes = 0;
for (const song of newSongs) {
  if (!existingSongIds.has(song.id)) {
    mergedSongs.push(song);
  } else {
    dupes++;
  }
}

console.log(`Existing: ${existingBooks.length} books, ${existingSongs.length} songs`);
console.log(`New: ${newBooks.length} books, ${newSongs.length} songs`);
console.log(`Merged: ${mergedBooks.length} books, ${mergedSongs.length} songs (${dupes} duplicate songs skipped)`);

// Write merged data
writeFileSync('src/data/books.json', JSON.stringify(mergedBooks, null, 2) + '\n');
writeFileSync('src/data/songs.json', JSON.stringify(mergedSongs, null, 2) + '\n');

console.log('\nWrote src/data/books.json and src/data/songs.json');

// Print summary by series
const seriesMap = {};
for (const book of mergedBooks) {
  if (!seriesMap[book.series]) seriesMap[book.series] = { books: 0, songs: 0 };
  seriesMap[book.series].books++;
  seriesMap[book.series].songs += mergedSongs.filter(s => s.bookId === book.id).length;
}
console.log('\n=== Series Summary ===');
for (const [series, data] of Object.entries(seriesMap)) {
  console.log(`  ${series}: ${data.books} books, ${data.songs} songs`);
}
