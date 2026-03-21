#!/usr/bin/env node
/**
 * Download cover images for all PreTime-to-BigTime books and update books.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const scrapedBooks = JSON.parse(readFileSync('scripts/pretime-bigtime-books.json', 'utf8'));
const books = JSON.parse(readFileSync('src/data/books.json', 'utf8'));

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const scraped of scrapedBooks) {
  const sku = scraped._sku;
  const bookId = scraped.id;
  const coverUrl = `https://pianoadventures.com/wp-content/uploads/sites/13/product_images/${sku}_cover.jpg`;
  const localPath = `public/covers/${bookId}.jpg`;
  const webPath = `/covers/${bookId}.jpg`;

  if (existsSync(localPath)) {
    skipped++;
    continue;
  }

  process.stdout.write(`Downloading ${bookId}...`);
  try {
    execSync(`curl -s -L -o "${localPath}" "${coverUrl}"`, { timeout: 15000 });
    // Verify it's a real image (not a 404 page)
    const size = execSync(`wc -c < "${localPath}"`, { encoding: 'utf-8' }).trim();
    if (parseInt(size) < 1000) {
      execSync(`rm "${localPath}"`);
      process.stdout.write(` SKIP (too small: ${size} bytes)\n`);
      failed++;
      continue;
    }
    downloaded++;
    process.stdout.write(` OK (${Math.round(parseInt(size)/1024)}KB)\n`);
  } catch (e) {
    process.stdout.write(` FAILED\n`);
    failed++;
    continue;
  }

  // Update the book in books.json
  const book = books.find(b => b.id === bookId);
  if (book) {
    book.coverImage = webPath;
  }

  // Small delay
  execSync('sleep 0.2');
}

// Also set coverImage for books that already had images downloaded
for (const scraped of scrapedBooks) {
  const localPath = `public/covers/${scraped.id}.jpg`;
  if (existsSync(localPath)) {
    const book = books.find(b => b.id === scraped.id);
    if (book && !book.coverImage) {
      book.coverImage = `/covers/${scraped.id}.jpg`;
    }
  }
}

writeFileSync('src/data/books.json', JSON.stringify(books, null, 2) + '\n');

console.log(`\nDone! Downloaded: ${downloaded}, Skipped (exists): ${skipped}, Failed: ${failed}`);
console.log(`Updated books.json with cover image paths`);
