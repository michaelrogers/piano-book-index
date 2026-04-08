#!/usr/bin/env node
/**
 * One-time fix: sync expectedTitle in amazon-verified.json with books.json titles.
 */
import { readFileSync, writeFileSync } from 'fs';

const booksPath = new URL('../src/data/books.json', import.meta.url);
const verifiedPath = new URL('../src/data/amazon-verified.json', import.meta.url);
const books = JSON.parse(readFileSync(booksPath, 'utf-8'));
const verified = JSON.parse(readFileSync(verifiedPath, 'utf-8'));

const bookMap = new Map(books.map(b => [b.id, b]));
let changed = 0;

for (const entry of verified.books) {
  const book = bookMap.get(entry.bookId);
  if (book && entry.expectedTitle !== book.title) {
    console.log(`${entry.bookId}: "${entry.expectedTitle}" → "${book.title}"`);
    entry.expectedTitle = book.title;
    changed++;
  }
}

writeFileSync(verifiedPath, JSON.stringify(verified, null, 2) + '\n', 'utf-8');
console.log(`\nUpdated ${changed} entries`);
