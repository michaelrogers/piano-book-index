#!/usr/bin/env node
/**
 * Scrape all PreTime-to-BigTime books from pianoadventures.com
 * Extracts: SKU, ISBN, page count, description, song titles, cover URL
 * Outputs: books and songs JSON to stdout
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

const LEVELS = [
  { prefix: 'pretime', series: 'PreTime Piano', faberLevel: 'Primer', difficultyLabel: 'Beginner' },
  { prefix: 'playtime', series: 'PlayTime Piano', faberLevel: 'Level 1', difficultyLabel: 'Beginner' },
  { prefix: 'showtime', series: 'ShowTime Piano', faberLevel: 'Level 2A', difficultyLabel: 'Early Intermediate' },
  { prefix: 'chordtime', series: 'ChordTime Piano', faberLevel: 'Level 2B', difficultyLabel: 'Early Intermediate' },
  { prefix: 'funtime', series: 'FunTime Piano', faberLevel: 'Level 3A-3B', difficultyLabel: 'Intermediate' },
  { prefix: 'bigtime', series: 'BigTime Piano', faberLevel: 'Level 4', difficultyLabel: 'Late Intermediate' },
];

const STYLES = [
  'christmas', 'classics', 'disney', 'favorites', 'hits', 'hymns',
  'jazz-blues', 'jewish-favorites', 'kids-songs', 'music-from-china',
  'popular', 'ragtime-marches', 'rock-n-roll', 'faber-studio-collection',
];

// Also include AdvanceTime Christmas (listed under BigTime section)
const EXTRA_BOOKS = [
  { slug: 'advancetime-piano-christmas', prefix: 'advancetime', series: 'AdvanceTime Piano', faberLevel: 'Level 3B-4', difficultyLabel: 'Intermediate', style: 'christmas' },
];

function fetchPage(url) {
  try {
    const html = execSync(`curl -s -L --max-time 15 "${url}"`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 5 });
    return html;
  } catch (e) {
    return null;
  }
}

function extractFromHtml(html) {
  const details = {};

  // Extract from JSON-LD structured data (most reliable)
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      details.name = (ld.name || '').replace(/&reg;|&amp;reg;/g, '').replace(/&amp;/g, '&').trim();
      details.sku = ld.sku || '';
      details.image = ld.image || '';
      // Description from JSON-LD - clean up whitespace
      if (ld.description) {
        details.description = ld.description
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        // Often starts with "Description " from the heading
        details.description = details.description.replace(/^Description\s+/, '');
        // Stop at "More ... Books" section
        details.description = details.description.replace(/\s*More \w+Time Books.*$/i, '').trim();
        // Remove trailing cart/price/quickview junk
        details.description = details.description.replace(/\s*Add to cart.*$/i, '').trim();
      }
    } catch (e) {
      // JSON parse failed, fall through
    }
  }

  // Extract ISBN and pages from attribute table
  // Pattern: <th class="product_attribute_label">isbn13</th>\n<td class="product_attribute_value"><p>VALUE</p>
  const isbnMatch = html.match(/product_attribute_label">isbn13<\/th>\s*<td[^>]*><p>(\d+)<\/p>/i);
  if (isbnMatch) details.isbn = isbnMatch[1];

  const pagesMatch = html.match(/product_attribute_label">pages<\/th>\s*<td[^>]*><p>(\d+)<\/p>/i);
  if (pagesMatch) details.pages = parseInt(pagesMatch[1]);

  const pubMatch = html.match(/product_attribute_label">publication-date<\/th>\s*<td[^>]*><p>(\d+)<\/p>/i);
  if (pubMatch) details.year = pubMatch[1];

  return details;
}

function parseSongsFromDescription(desc) {
  // Songs are listed after "Contents include:" or "include:" or just listed with bullet separators
  // Common patterns:
  // "Contents include: Song1 • Song2 • Song3."
  // "Song1 • Song2 • Song3"
  // Sometimes songs are just after the first sentence

  // Clean HTML entities
  let text = desc
    .replace(/&bull;/g, '•')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2022/g, '•')
    .replace(/\u00e9/g, 'é');

  // Split by bullet character
  if (text.includes('•')) {
    // Find the song list portion - often after "include:" or "Contents:"
    const includeMatch = text.match(/(?:Contents?\s+)?include[s]?\s*:?\s*(.*)/is);
    let songPart;
    if (includeMatch) {
      songPart = includeMatch[1];
    } else {
      // No "include:" pattern - try to find the bullet-separated section
      const bulletStart = text.indexOf('•');
      if (bulletStart > 0) {
        // Go back to find the start of the song list
        const beforeBullet = text.substring(0, bulletStart);
        const lastPeriod = beforeBullet.lastIndexOf('.');
        songPart = text.substring(lastPeriod + 1);
      }
    }

    const songs = songPart.split('•').map(s => {
      let cleaned = s.trim().replace(/\.$/, '').trim();
      // Remove leftover "include:" prefix from first entry
      cleaned = cleaned.replace(/^(?:Contents?\s+)?include[s]?\s*:?\s*/i, '').trim();
      return cleaned;
    }).filter(s => s.length > 0 && s.length < 200);
    return songs;
  }

  return [];
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

function formatIsbn(raw) {
  if (!raw) return '';
  // Format as 978-XXXXXXXXXX
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 13) {
    return `978-${digits.substring(3)}`;
  }
  return raw;
}

async function main() {
  const allBooks = [];
  const allSongs = [];
  const failedUrls = [];

  // Build the list of books to scrape
  const bookJobs = [];

  for (const level of LEVELS) {
    for (const style of STYLES) {
      const slug = `${level.prefix}-piano-${style}`;
      bookJobs.push({
        slug,
        url: `https://pianoadventures.com/product/${slug}/`,
        series: level.series,
        faberLevel: level.faberLevel,
        difficultyLabel: level.difficultyLabel,
        style,
        prefix: level.prefix,
      });
    }
  }

  // Add extras
  for (const extra of EXTRA_BOOKS) {
    bookJobs.push({
      slug: extra.slug,
      url: `https://pianoadventures.com/product/${extra.slug}/`,
      series: extra.series,
      faberLevel: extra.faberLevel,
      difficultyLabel: extra.difficultyLabel,
      style: extra.style,
      prefix: extra.prefix,
    });
  }

  console.error(`Scraping ${bookJobs.length} product pages...`);

  for (const job of bookJobs) {
    process.stderr.write(`  ${job.slug}...`);
    const html = fetchPage(job.url);

    if (!html || html.length < 1000) {
      process.stderr.write(' SKIP (page not found)\n');
      failedUrls.push(job.slug);
      continue;
    }

    // Check for 404 / product not found
    if (html.includes('page-not-found') || html.includes('Nothing was found') || html.includes('Error 404')) {
      process.stderr.write(' SKIP (404)\n');
      failedUrls.push(job.slug);
      continue;
    }

    const details = extractFromHtml(html);
    if (!details.sku) {
      process.stderr.write(' SKIP (no SKU found)\n');
      failedUrls.push(job.slug);
      continue;
    }

    const desc = details.description || '';
    const songs = parseSongsFromDescription(desc);

    const styleName = {
      'christmas': 'Christmas',
      'classics': 'Classics',
      'disney': 'Disney',
      'favorites': 'Favorites',
      'hits': 'Hits',
      'hymns': 'Hymns',
      'jazz-blues': 'Jazz & Blues',
      'jewish-favorites': 'Jewish Favorites',
      'kids-songs': "Kids' Songs",
      'music-from-china': 'Music from China',
      'popular': 'Popular',
      'ragtime-marches': 'Ragtime & Marches',
      'rock-n-roll': "Rock 'n Roll",
      'faber-studio-collection': 'Faber Studio Collection',
    }[job.style] || job.style;

    const bookId = job.slug;
    const bookTitle = details.name || `${job.series} ${styleName}`;

    // Clean description for storage - just the first part before song list
    let cleanDesc = desc;
    const contentsIdx = cleanDesc.search(/Contents?\s+include/i);
    if (contentsIdx > 0) {
      cleanDesc = cleanDesc.substring(0, contentsIdx).trim();
    }
    // Also trim at first bullet
    const bulletIdx = cleanDesc.indexOf('\u2022');
    if (bulletIdx > 0) {
      cleanDesc = cleanDesc.substring(0, bulletIdx).trim();
    }

    const book = {
      id: bookId,
      title: bookTitle.replace(/®/g, '').replace(/\u00ae/g, ''),
      series: job.series,
      seriesLevel: styleName,
      bookType: 'companion',
      publisher: 'Faber Piano Adventures',
      isbn: formatIsbn(details.isbn),
      coverImage: '',  // Will download separately
      pageCount: details.pages || null,
      description: (cleanDesc || desc).substring(0, 500),
      amazonUrl: '',
      _sku: details.sku,
      _faberLevel: job.faberLevel,
      _difficultyLabel: job.difficultyLabel,
      _songCount: songs.length,
    };

    allBooks.push(book);

    // Generate song entries
    for (const songTitle of songs) {
      const songId = `${bookId}-${slugify(songTitle)}`;
      allSongs.push({
        id: songId,
        title: songTitle,
        composer: '',
        arranger: 'Nancy and Randall Faber',
        genre: styleName,
        bookId: bookId,
        pageNumber: null,
        difficulty: {
          label: job.difficultyLabel,
          faberLevel: job.faberLevel,
          alfredLevel: null,
        },
        youtubeLinks: [],
        notes: '',
      });
    }

    process.stderr.write(` OK (${details.sku}, ${details.pages}pp, ${songs.length} songs)\n`);

    // Small delay to be polite
    execSync('sleep 0.3');
  }

  console.error(`\nDone! ${allBooks.length} books, ${allSongs.length} songs`);
  if (failedUrls.length > 0) {
    console.error(`Failed/not found: ${failedUrls.join(', ')}`);
  }

  // Write output files
  writeFileSync('scripts/pretime-bigtime-books.json', JSON.stringify(allBooks, null, 2));
  writeFileSync('scripts/pretime-bigtime-songs.json', JSON.stringify(allSongs, null, 2));

  console.error(`\nWrote scripts/pretime-bigtime-books.json and scripts/pretime-bigtime-songs.json`);

  // Summary table
  console.error('\n=== Summary ===');
  for (const level of [...LEVELS, { prefix: 'advancetime', series: 'AdvanceTime Piano' }]) {
    const levelBooks = allBooks.filter(b => b.series === level.series);
    const levelSongs = allSongs.filter(s => levelBooks.some(b => b.id === s.bookId));
    console.error(`${level.series}: ${levelBooks.length} books, ${levelSongs.length} songs`);
  }
}

main().catch(console.error);

