#!/usr/bin/env node
/**
 * Enforces verified-only Amazon URLs.
 * A book gets an amazonUrl only when it has a verified ASIN entry in amazon-verified.json.
 *
 * Usage:
 *   node scripts/fill-amazon-urls.mjs --dry-run      # Preview changes
 *   node scripts/fill-amazon-urls.mjs                # Apply changes
 *   node scripts/fill-amazon-urls.mjs --suggest-isbn # Print ISBN-10 suggestions for missing verifications
 */

import { readFileSync, writeFileSync } from 'fs';

const DRY_RUN = process.argv.includes('--dry-run');
const SUGGEST_ISBN = process.argv.includes('--suggest-isbn');
const booksPath = new URL('../src/data/books.json', import.meta.url);
const verifiedPath = new URL('../src/data/amazon-verified.json', import.meta.url);
const books = JSON.parse(readFileSync(booksPath, 'utf-8'));
const verifiedData = JSON.parse(readFileSync(verifiedPath, 'utf-8'));
const verifiedBooks = Array.isArray(verifiedData.books) ? verifiedData.books : [];
const verifiedByBookId = new Map(verifiedBooks.map((entry) => [entry.bookId, String(entry.asin).toUpperCase()]));

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

let setVerified = 0;
let clearedUnverified = 0;
let unchanged = 0;
let missingVerification = 0;

const suggestions = [];

for (const book of books) {
  const asin = verifiedByBookId.get(book.id);
  if (!asin) {
    if (book.amazonUrl) {
      console.log('  CLEAR (unverified): ' + book.id + ' - ' + book.amazonUrl);
      book.amazonUrl = '';
      clearedUnverified++;
    } else {
      unchanged++;
    }
    missingVerification++;

    if (SUGGEST_ISBN) {
      const isbn10 = book.isbn ? isbn13to10(book.isbn) : null;
      if (isbn10) {
        suggestions.push({
          bookId: book.id,
          title: book.title,
          isbn: book.isbn,
          suggestedAsin: isbn10,
        });
      }
    }
    continue;
  }

  const verifiedUrl = 'https://www.amazon.com/dp/' + asin;
  if (book.amazonUrl !== verifiedUrl) {
    console.log('  SET (verified): ' + book.id + ' -> ' + verifiedUrl);
    book.amazonUrl = verifiedUrl;
    setVerified++;
  } else {
    unchanged++;
  }
}

console.log('\nSummary:');
console.log('  Set verified links: ' + setVerified);
console.log('  Cleared unverified links: ' + clearedUnverified);
console.log('  Missing verification entries: ' + missingVerification);
console.log('  Unchanged: ' + unchanged);

if (SUGGEST_ISBN) {
  console.log('\nISBN suggestions for missing verification entries (advisory only):');
  if (suggestions.length === 0) {
    console.log('  (none)');
  } else {
    for (const item of suggestions) {
      console.log('  ' + item.bookId + ' | ' + item.isbn + ' -> ' + item.suggestedAsin + ' | ' + item.title);
    }
  }
}

if (!DRY_RUN) {
  writeFileSync(booksPath, JSON.stringify(books, null, 2) + '\n', 'utf-8');
  console.log('Written to books.json');
} else if (DRY_RUN) {
  console.log('(dry run - no changes written)');
}
