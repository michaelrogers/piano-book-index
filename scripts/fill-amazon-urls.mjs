#!/usr/bin/env node
/**
 * Fills in empty amazonUrl fields in books.json using ISBN-13 to ISBN-10 conversion.
 * Amazon product pages use ISBN-10 as ASIN for books: https://www.amazon.com/dp/{ISBN10}
 *
 * Usage:
 *   node scripts/fill-amazon-urls.mjs --dry-run   # Preview changes
 *   node scripts/fill-amazon-urls.mjs              # Apply changes
 */

import { readFileSync, writeFileSync } from 'fs';

const DRY_RUN = process.argv.includes('--dry-run');
const booksPath = new URL('../src/data/books.json', import.meta.url);
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

let filled = 0;
let skipped = 0;
let noIsbn = 0;

for (const book of books) {
  if (book.amazonUrl) continue;

  if (!book.isbn) {
    console.log('  SKIP (no ISBN): ' + book.id + ' - ' + book.title);
    noIsbn++;
    continue;
  }

  const isbn10 = isbn13to10(book.isbn);
  if (!isbn10) {
    console.log('  SKIP (bad ISBN): ' + book.id + ' - ISBN: ' + book.isbn);
    skipped++;
    continue;
  }

  const url = 'https://www.amazon.com/dp/' + isbn10;
  console.log('  FILL: ' + book.id + ' -> ' + url);
  book.amazonUrl = url;
  filled++;
}

console.log('\n' + filled + ' books filled, ' + skipped + ' skipped (bad ISBN), ' + noIsbn + ' skipped (no ISBN)');

if (!DRY_RUN && filled > 0) {
  writeFileSync(booksPath, JSON.stringify(books, null, 2) + '\n', 'utf-8');
  console.log('Written to books.json');
} else if (DRY_RUN) {
  console.log('(dry run - no changes written)');
}
