#!/usr/bin/env node
/**
 * Add trackListingSource field to all books in books.json
 */
import { readFileSync, writeFileSync } from 'fs';

const books = JSON.parse(readFileSync('src/data/books.json', 'utf-8'));
const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf-8'));

// Build lookup: which books have songs with page numbers
const booksWithPages = new Set();
songs.forEach(s => {
  if (s.pageNumber !== null) booksWithPages.add(s.bookId);
});

// Determine source for each book
books.forEach(b => {
  const hasSongs = songs.some(s => s.bookId === b.id);

  if (!hasSongs) {
    b.trackListingSource = null;
  } else if (booksWithPages.has(b.id)) {
    // Has real page numbers = manually entered from physical book
    b.trackListingSource = 'manual-entry';
  } else if (b.publisher === 'Faber Piano Adventures' && b.series && !b.series.includes('Adult')) {
    // PreTime-BigTime: scraped from pianoadventures.com
    b.trackListingSource = 'publisher-website';
  } else {
    // Others with songs but no pages (e.g. Alfred GH2)
    b.trackListingSource = 'manual-entry';
  }
});

writeFileSync('src/data/books.json', JSON.stringify(books, null, 2) + '\n');

// Summary
const sources = {};
books.forEach(b => {
  const src = b.trackListingSource || 'null';
  sources[src] = (sources[src] || 0) + 1;
});
console.log('Track listing sources:', JSON.stringify(sources));
