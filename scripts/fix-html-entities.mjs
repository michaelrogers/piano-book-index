#!/usr/bin/env node
/**
 * One-time fix: decode HTML entities in books.json titles and descriptions.
 */
import { readFileSync, writeFileSync } from 'fs';

const booksPath = new URL('../src/data/books.json', import.meta.url);
const books = JSON.parse(readFileSync(booksPath, 'utf-8'));

function decodeEntities(str) {
  return str
    .replace(/&#038;/g, '&')
    .replace(/&#8217;/g, '\u2019')  // right single quote '
    .replace(/&#8216;/g, '\u2018')  // left single quote '
    .replace(/&#8220;/g, '\u201C')  // left double quote "
    .replace(/&#8221;/g, '\u201D')  // right double quote "
    .replace(/&amp;amp;/g, '&')     // double-encoded &amp;amp; → &
    .replace(/&amp;/g, '&');
}

let changed = 0;
for (const book of books) {
  const origTitle = book.title;
  const origDesc = book.description;
  book.title = decodeEntities(book.title);
  if (book.description) book.description = decodeEntities(book.description);
  if (book.title !== origTitle || book.description !== origDesc) {
    console.log(`Fixed: ${book.id}`);
    if (book.title !== origTitle) console.log(`  title: ${origTitle} → ${book.title}`);
    if (book.description !== origDesc) console.log(`  description: (entities decoded)`);
    changed++;
  }
}

writeFileSync(booksPath, JSON.stringify(books, null, 2) + '\n', 'utf-8');
console.log(`\nFixed ${changed} books`);
