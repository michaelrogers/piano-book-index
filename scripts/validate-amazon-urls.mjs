#!/usr/bin/env node
/**
 * Warn-only validation for Amazon link verification metadata.
 * This script never exits non-zero; it is intended for CI visibility without blocking builds.
 */
import { readFileSync } from 'fs';

const books = JSON.parse(readFileSync('src/data/books.json', 'utf8'));
const verifiedData = JSON.parse(readFileSync('src/data/amazon-verified.json', 'utf8'));

const verifiedEntries = Array.isArray(verifiedData.books) ? verifiedData.books : [];
const verifiedByBookId = new Map();
const warnings = [];

function normalizeTitle(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseAsin(url) {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

for (const entry of verifiedEntries) {
  if (!entry.bookId) {
    warnings.push('Verified entry missing bookId.');
    continue;
  }
  if (verifiedByBookId.has(entry.bookId)) {
    warnings.push(`Duplicate verified entry for bookId ${entry.bookId}.`);
    continue;
  }
  if (!entry.asin || !/^[A-Z0-9]{10}$/i.test(entry.asin)) {
    warnings.push(`Verified entry has invalid ASIN for ${entry.bookId}.`);
  }
  verifiedByBookId.set(entry.bookId, entry);
}

for (const book of books) {
  const entry = verifiedByBookId.get(book.id);

  if (!entry && book.amazonUrl) {
    warnings.push(`${book.id}: amazonUrl exists but has no verification entry.`);
    continue;
  }

  if (!entry) {
    continue;
  }

  const expectedUrl = `https://www.amazon.com/dp/${String(entry.asin).toUpperCase()}`;
  if (book.amazonUrl && book.amazonUrl !== expectedUrl) {
    warnings.push(`${book.id}: amazonUrl differs from verified ASIN URL (${book.amazonUrl} vs ${expectedUrl}).`);
  }

  const actualAsin = book.amazonUrl ? parseAsin(book.amazonUrl) : null;
  if (book.amazonUrl && actualAsin !== String(entry.asin).toUpperCase()) {
    warnings.push(`${book.id}: amazonUrl ASIN does not match verified ASIN.`);
  }

  if (!entry.expectedTitle) {
    warnings.push(`${book.id}: verified entry is missing expectedTitle.`);
  } else if (normalizeTitle(entry.expectedTitle) !== normalizeTitle(book.title)) {
    warnings.push(`${book.id}: expectedTitle in verification data does not match catalog title.`);
  }

  if (!entry.verifiedAt) {
    warnings.push(`${book.id}: verified entry is missing verifiedAt.`);
  }

  if (!entry.verifiedMethod) {
    warnings.push(`${book.id}: verified entry is missing verifiedMethod.`);
  }

  if (entry.isbn && book.isbn && entry.isbn !== book.isbn) {
    warnings.push(`${book.id}: verified entry ISBN differs from book ISBN.`);
  }
}

if (warnings.length === 0) {
  console.log('Amazon URL validation: no warnings.');
} else {
  console.warn(`Amazon URL validation: ${warnings.length} warning(s).`);
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

process.exit(0);
