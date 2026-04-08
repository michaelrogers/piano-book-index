#!/usr/bin/env node
/**
 * Batch-verify Amazon links by fetching each book's ISBN-derived Amazon page
 * and comparing the product title against our catalog title.
 *
 * Outputs a report of matches, mismatches, and errors.
 * With --write, generates verified entries into amazon-verified.json for matches.
 *
 * Usage:
 *   node scripts/verify-amazon-links.mjs                # Report only
 *   node scripts/verify-amazon-links.mjs --write        # Report + write matches to amazon-verified.json
 *   node scripts/verify-amazon-links.mjs --delay=3000   # Custom delay between requests (ms)
 */

import { readFileSync, writeFileSync } from 'fs';

const WRITE = process.argv.includes('--write');
const delayArg = process.argv.find((a) => a.startsWith('--delay='));
const DELAY_MS = delayArg ? parseInt(delayArg.split('=')[1], 10) : 2500;

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

function decodeHtmlEntities(str) {
  return str
    .replace(/&#0*38;/g, '&')
    .replace(/&#0*39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalize(str) {
  return decodeHtmlEntities(str)
    .toLowerCase()
    .replace(/[''\u2018\u2019\u201C\u201D"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Significant words (skip short/common filler) */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'and', 'in', 'to', 'with', 'from', 'by', 'on', 'at', 'is',
  'book', 'level', 'piano', 'course', 'method', 'sheet', 'music', 'students', 'faber',
]);

function keyWords(normalizedStr) {
  return normalizedStr.split(' ').filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function titleSimilarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  // Jaccard similarity
  const wordsA = na.split(' ');
  const wordsB = nb.split(' ');
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = [...setA].filter((w) => setB.has(w));
  const union = new Set([...setA, ...setB]);
  const jaccard = intersection.length / union.size;

  // Key-word containment: do all our key words appear in the Amazon title?
  const ourKeys = keyWords(na);
  const amazonWords = new Set(nb.split(' '));
  const containedCount = ourKeys.filter((w) => amazonWords.has(w)).length;
  const containment = ourKeys.length > 0 ? containedCount / ourKeys.length : 0;

  // Use the higher of the two signals
  return Math.max(jaccard, containment);
}

async function fetchAmazonTitle(asin) {
  const url = `https://www.amazon.com/dp/${asin}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    return { error: `HTTP ${res.status}`, title: null, finalUrl: res.url };
  }

  const html = await res.text();

  // Check for CAPTCHA / bot detection
  if (html.includes('captcha') || html.includes('Robot Check') || html.includes('api-services-support@amazon.com')) {
    return { error: 'CAPTCHA', title: null, finalUrl: res.url };
  }

  // Extract product title from <span id="productTitle">
  let title = null;
  const productTitleMatch = html.match(/<span\s+id="productTitle"[^>]*>\s*([\s\S]*?)\s*<\/span>/i);
  if (productTitleMatch) {
    title = productTitleMatch[1].replace(/<[^>]+>/g, '').trim();
  }

  // Fallback: <title> tag
  if (!title) {
    const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleTagMatch) {
      // Amazon title format: "Product Name : Amazon.com: Books"
      title = titleTagMatch[1].split(':')[0].trim();
      if (title === 'Amazon.com' || title.length < 5) title = null;
    }
  }

  // Check for "currently unavailable" or dog page
  if (html.includes('currently unavailable') && !title) {
    return { error: 'unavailable', title: null, finalUrl: res.url };
  }

  return { error: null, title, finalUrl: res.url };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Main ---
const results = { match: [], mismatch: [], error: [], noIsbn: [] };
const today = new Date().toISOString().slice(0, 10);
let processed = 0;

console.log(`Verifying ${books.length} books against Amazon (delay: ${DELAY_MS}ms)...\n`);

for (const book of books) {
  processed++;
  const prefix = `[${processed}/${books.length}]`;

  if (!book.isbn) {
    console.log(`${prefix} SKIP (no ISBN): ${book.id}`);
    results.noIsbn.push(book);
    continue;
  }

  const isbn10 = isbn13to10(book.isbn);
  if (!isbn10) {
    console.log(`${prefix} SKIP (bad ISBN): ${book.id} - ${book.isbn}`);
    results.noIsbn.push(book);
    continue;
  }

  const { error, title: amazonTitle, finalUrl } = await fetchAmazonTitle(isbn10);

  if (error) {
    console.log(`${prefix} ERROR (${error}): ${book.id} - https://www.amazon.com/dp/${isbn10}`);
    results.error.push({ book, isbn10, error, finalUrl });

    if (error === 'CAPTCHA') {
      console.log('\n  Amazon is blocking requests. Stopping early.\n');
      // Mark remaining books as errors
      for (let i = processed; i < books.length; i++) {
        results.error.push({ book: books[i], isbn10: null, error: 'skipped-captcha', finalUrl: null });
      }
      break;
    }

    await sleep(DELAY_MS);
    continue;
  }

  if (!amazonTitle) {
    console.log(`${prefix} ERROR (no title found): ${book.id} - https://www.amazon.com/dp/${isbn10}`);
    results.error.push({ book, isbn10, error: 'no-title-extracted', finalUrl });
    await sleep(DELAY_MS);
    continue;
  }

  const similarity = titleSimilarity(book.title, amazonTitle);

  if (similarity >= 0.5) {
    console.log(`${prefix} MATCH (${(similarity * 100).toFixed(0)}%): ${book.id}`);
    console.log(`         Ours:   ${book.title}`);
    console.log(`         Amazon: ${amazonTitle}`);
    results.match.push({ book, isbn10, amazonTitle, similarity });
  } else {
    console.log(`${prefix} MISMATCH (${(similarity * 100).toFixed(0)}%): ${book.id}`);
    console.log(`         Ours:   ${book.title}`);
    console.log(`         Amazon: ${amazonTitle}`);
    results.mismatch.push({ book, isbn10, amazonTitle, similarity });
  }

  await sleep(DELAY_MS);
}

// --- Report ---
console.log('\n========== REPORT ==========\n');
console.log(`Matches:    ${results.match.length}`);
console.log(`Mismatches: ${results.mismatch.length}`);
console.log(`Errors:     ${results.error.length}`);
console.log(`No ISBN:    ${results.noIsbn.length}`);

if (results.mismatch.length > 0) {
  console.log('\n--- MISMATCHES (manual review needed) ---');
  for (const { book, isbn10, amazonTitle, similarity } of results.mismatch) {
    console.log(`  ${book.id}:`);
    console.log(`    Ours:   ${book.title}`);
    console.log(`    Amazon: ${amazonTitle}`);
    console.log(`    Score:  ${(similarity * 100).toFixed(0)}%`);
    console.log(`    URL:    https://www.amazon.com/dp/${isbn10}`);
  }
}

if (results.error.length > 0) {
  console.log('\n--- ERRORS (could not verify) ---');
  for (const { book, isbn10, error } of results.error) {
    console.log(`  ${book.id}: ${error}${isbn10 ? ` (https://www.amazon.com/dp/${isbn10})` : ''}`);
  }
}

// --- Write verified entries ---
if (WRITE && results.match.length > 0) {
  const verifiedData = JSON.parse(readFileSync(verifiedPath, 'utf-8'));
  const existingIds = new Set(verifiedData.books.map((b) => b.bookId));

  let added = 0;
  for (const { book, isbn10, amazonTitle } of results.match) {
    if (existingIds.has(book.id)) continue;
    verifiedData.books.push({
      bookId: book.id,
      asin: isbn10,
      expectedTitle: book.title,
      amazonTitle,
      verifiedAt: today,
      verifiedMethod: 'automated-title-match',
    });
    added++;
  }

  verifiedData.books.sort((a, b) => a.bookId.localeCompare(b.bookId));
  writeFileSync(verifiedPath, JSON.stringify(verifiedData, null, 2) + '\n', 'utf-8');
  console.log(`\nWrote ${added} new verified entries to amazon-verified.json`);
} else if (WRITE) {
  console.log('\nNo matches to write.');
}
