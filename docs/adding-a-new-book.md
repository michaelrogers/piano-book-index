# Adding a New Book — Agent Instructions

Step-by-step process for adding a new piano method book to the site. Follow every step in order. At the end, the build must pass (`npm run build`) before committing.

---

## Prerequisites

- Node.js available
- Working directory is the project root (`piano-sheet/`)
- Familiarity with the data files: `src/data/books.json`, `src/data/songs.json`, `src/data/book-playlists.json`, `scripts/youtube-playlists-curated.json`

---

## Step 1: Choose a Book ID

Generate a slug-style ID from the book's title. Convention:

| Series | Pattern | Examples |
|--------|---------|----------|
| Faber Adult Piano Adventures | `faber-{type}-{level}` | `faber-lesson-1`, `faber-classics-2` |
| Faber PreTime–BigTime | `{level}time-piano-{genre}` | `playtime-piano-classics`, `bigtime-piano-hits` |
| Alfred Adult All-in-One | `alfred-adult-aio-{level}` | `alfred-adult-aio-1` |
| Alfred Greatest Hits | `alfred-greatest-hits-{level}` | `alfred-greatest-hits-1` |
| Other | `{publisher}-{short-title}` | `hal-leonard-easy-classics-1` |

Rules:
- Lowercase, hyphen-separated, no special characters
- Max ~60 characters
- Must be unique across all existing books in `src/data/books.json`

---

## Step 2: Gather Book Metadata

Collect these fields from the publisher's product page, Amazon, or Hal Leonard:

| Field | Source | Notes |
|-------|--------|-------|
| `title` | Publisher page | Full title as printed on cover |
| `series` | Publisher page | e.g., "Faber Adult Piano Adventures", "Alfred's Basic Adult Piano Course" |
| `seriesLevel` | Publisher page | e.g., "Book 1", "Level 2A", "Level 3A-3B" |
| `bookType` | Determine from title | `"lesson"` for core instruction books, `"companion"` for supplementary (Classics, Popular, Christmas, Greatest Hits, etc.) |
| `publisher` | Publisher page | e.g., "Faber Piano Adventures", "Alfred Music" |
| `isbn` | Publisher/Amazon | ISBN-13 format: `"978-XXXXXXXXXX"` |
| `pageCount` | Publisher/Amazon | Integer or `null` if unknown |
| `description` | Publisher page | 1–3 sentences. Mention featured songs if listed. |
| `amazonUrl` | Amazon / ISBN | Amazon product URL — see "Amazon URL" below |
| `trackListingSource` | Your method | One of: `"publisher-website"`, `"manual-entry"`, `"photo-index"`, `"youtube-playlist"`, or `null` |

### Amazon URL

Every book should have an `amazonUrl` pointing to its Amazon product page. The URL format is `https://www.amazon.com/dp/{ISBN10}` where ISBN10 is derived from the book's ISBN-13.

**Important policy**: only add Amazon links after manual verification. If you cannot verify an exact match, set `amazonUrl` to `""`.

**Verification source of truth**: add/update an entry in `src/data/amazon-verified.json` for the book. Include:
- `bookId`
- `asin`
- `expectedTitle`
- `verifiedAt`
- `verifiedMethod`

`scripts/fill-amazon-urls.mjs` now enforces this policy: it will only set links for books present in `amazon-verified.json`, and clears unverified links.

**To sync from verified entries**:
```bash
npm run amazon:sync:dry   # Preview
npm run amazon:sync       # Apply to books.json
```

**Optional advisory suggestions**:
```bash
node scripts/fill-amazon-urls.mjs --suggest-isbn
```
This prints ISBN-13 -> ISBN-10 suggestions for books missing verification entries, but does not treat them as verified.

**To find manually**: Search Amazon for the book title + "piano" and use the `/dp/XXXXXXXXXX` product page URL.

**Important**: Do NOT include affiliate tags (`?tag=...`) in the `amazonUrl` stored in `books.json`. Affiliate tags are injected at build time via the `PUBLIC_AMAZON_TAG` environment variable. This keeps the source data clean and the affiliate ID out of the open-source repo.

If no Amazon listing exists, set `amazonUrl` to `""`.

### Amazon verification checklist

Before adding a verified ASIN entry:
1. Open the Amazon product page for the ASIN.
2. Confirm title and level/phase match exactly with the catalog book.
3. Confirm edition cues (series/book number, publisher, cover) match.
4. Add/update `src/data/amazon-verified.json`.
5. Run `npm run amazon:sync`.
6. Run `npm run amazon:validate` and review warnings.

### Where to find data

**Faber books**: `https://pianoadventures.com/browse/libraries/piano-adventures/` — Product pages contain JSON-LD with ISBN. Song lists appear under "Contents include:" as bullet-separated (•) text.

**Alfred books**: `https://www.alfred.com/` — Search by title. Song lists may appear in product descriptions or as bullet lists. Less structured than Faber.

**Amazon**: Supplement with page count, description, and ISBN when publisher pages are incomplete.

---

## Step 3: Download the Cover Image

Cover images live in `public/covers/` named `{bookId}.jpg`.

### For Faber books (automated)

If the book has a Faber SKU, the CDN URL is:
```
https://pianoadventures.com/wp-content/uploads/sites/13/product_images/{SKU}_cover.jpg
```

Download with:
```bash
curl -s -L -o "public/covers/{bookId}.jpg" "https://pianoadventures.com/wp-content/uploads/sites/13/product_images/{SKU}_cover.jpg"
```

Verify the file is a real image (not an HTML 404 page):
```bash
file public/covers/{bookId}.jpg   # Should say "JPEG image data"
wc -c < public/covers/{bookId}.jpg  # Must be > 1000 bytes
```

### For non-Faber books (manual)

1. Find a high-quality cover image from the publisher or Amazon.
2. Save as `public/covers/{bookId}.jpg`.
3. Recommended: ≥300px wide, JPEG format.

---

## Step 4: Add the Book to `books.json`

Open `src/data/books.json` and append a new entry to the array:

```json
{
  "id": "your-book-id",
  "title": "Full Book Title",
  "series": "Series Name",
  "seriesLevel": "Book 1",
  "bookType": "lesson",
  "publisher": "Publisher Name",
  "isbn": "978-XXXXXXXXXX",
  "coverImage": "/covers/your-book-id.jpg",
  "pageCount": 120,
  "description": "Description of the book with featured songs.",
  "amazonUrl": "https://www.amazon.com/dp/XXXXXXXXXX",
  "trackListingSource": "publisher-website"
}
```

Maintain alphabetical order by `id` within the array if practical, or append at the end.

---

## Step 5: Extract the Song List

### From Faber product pages

Look for "Contents include:" text. Song titles are bullet-separated using `•` (U+2022). Parse by splitting on `•`, trimming whitespace, and discarding entries longer than 200 characters (those are typically section blurbs, not song titles).

### From Alfred product pages

Song lists are less structured. Look for unordered lists or newline-separated titles in product descriptions. May require manual entry.

### From the physical book (photo-index)

If no online source is available, photograph the table of contents and transcribe. Set `trackListingSource` to `"photo-index"`.

### From YouTube playlists

If a trusted channel has a playlist for the book, extract song titles from video titles. Set `trackListingSource` to `"youtube-playlist"`.

### Information to gather per song

| Field | Notes |
|-------|-------|
| Title | As printed in the book |
| Composer | Original composer. Use `"Traditional"` for folk songs, `"Unknown"` if unlisted |
| Arranger | Usually the book's arranger (e.g., `"Faber & Faber"`, `"Dennis Alexander"`). Can be `null` |
| Genre | One of: Classical, Jazz, Pop, Rock, Folk, Holiday, Hymn, Ragtime, Disney, Broadway, Film, Blues, Latin, Country, Patriotic, New Age |
| Page number | Integer page in the book, or `null` if unknown |
| Section/notes | Chapter or section heading, e.g., `"Unit 3: Reading in C Position"`, `"Section 1: Beginning Classics"` |

---

## Step 6: Add Songs to `songs.json`

Each song gets an entry in `src/data/songs.json`.

### Song ID format

```
{bookId}-{slugified-title}
```

Slugify rules:
- Lowercase
- Normalize Unicode (NFD → strip combining marks)
- Replace `&` with `and`
- Replace non-alphanumeric characters with hyphens
- Collapse multiple hyphens
- Trim leading/trailing hyphens
- Max 60 characters total

Example: Book `faber-classics-1`, song "Theme from Symphony No. 104 (London Symphony)" → `faber-classics-1-theme-from-symphony-no-104-london-symphony`

### Song entry template

```json
{
  "id": "bookid-slugified-title",
  "title": "Song Title",
  "composer": "Composer Name",
  "arranger": "Arranger Name",
  "genre": "Classical",
  "bookId": "your-book-id",
  "pageNumber": 6,
  "difficulty": {
    "label": "Beginner",
    "faberLevel": null,
    "alfredLevel": null
  },
  "youtubeLinks": [],
  "notes": "Section or unit name"
}
```

### Difficulty assignment

Use the book's series and level to determine difficulty. Reference table:

| Series/Level | `label` | `faberLevel` | `alfredLevel` |
|-------------|---------|-------------|--------------|
| Faber Lesson Book 1 (Units 1-5) | `"Beginner"` | `"Book 1"` | `null` |
| Faber Lesson Book 1 (Units 6-10) / Book 2 (Units 1-5) | `"Early Intermediate"` | `"Book 1"` or `"Book 2"` | `null` |
| Faber Lesson Book 2 (Units 6-10) | `"Intermediate"` | `"Book 2"` | `null` |
| PreTime (Primer) / PlayTime (Level 1) | `"Beginner"` | `"Primer"` or `"Level 1"` | `null` |
| ShowTime (Level 2A) / ChordTime (Level 2B) | `"Early Intermediate"` | `"Level 2A"` or `"Level 2B"` | `null` |
| FunTime (Level 3A-3B) | `"Intermediate"` | `"Level 3A-3B"` | `null` |
| BigTime (Level 4) | `"Late Intermediate"` | `"Level 4"` | `null` |
| AdvanceTime (Level 3B-4) | `"Intermediate"` | `"Level 3B-4"` | `null` |
| Alfred Level 1 | `"Beginner"` | `null` | `"Level 1"` |
| Alfred Level 2 | `"Early Intermediate"` | `null` | `"Level 2"` |
| Alfred Level 3 | `"Intermediate"` | `null` | `"Level 3"` |
| Alfred Level 4-5 | `"Late Intermediate"` | `null` | `"Level 4-5"` |
| Alfred Level 6+ | `"Early Advanced"` | `null` | `"Level 6+"` |

All songs in the same book typically share the same difficulty (companion books) or progress through difficulties (lesson books — assign per unit/section).

### Important

- Initialize `youtubeLinks` as an empty array `[]`. Links are added in Step 8.
- Keep songs in page-number order within the file.
- Ensure every `bookId` matches the book's `id` in `books.json`.

---

## Step 7: Find YouTube Playlists from Approved Channels

### Approved channels (priority order)

| Channel | Specialization |
|---------|---------------|
| **Piano Adventures** | Official Faber channel. Playlists for lesson and supplementary books. |
| **92pianokeys** | Alfred Adult All-in-One, Alfred Greatest Hits. |
| **Amy Comparetto** | Faber supplementary (PreTime–BigTime), Easy Piano Classics. |
| **Karen Rock Music** | Faber Adult Piano Adventures Classics and Popular. |
| **Let's Play Piano Methods** | Faber lesson books, supplementary books. |

### How to find playlists

1. Visit the channel's playlists page (URLs are in `scripts/youtube-playlists-curated.json` under `channels`).
2. Search for playlists matching the book title or series.
3. Verify the playlist actually covers the target book (check video titles against your song list).

### Scraping playlist tracks

Use the existing scraper to fetch video metadata from a playlist:

```bash
# Fetch playlist page and extract video data
node -e "
const { execSync } = require('child_process');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const html = execSync(\`curl -s -L --max-time 30 -A '\${UA}' 'https://www.youtube.com/playlist?list=PLAYLIST_ID'\`, { encoding: 'utf-8', maxBuffer: 20*1024*1024 });
const match = html.match(/var ytInitialData = ({.+?});/s) || html.match(/ytInitialData\s*=\s*({.+?});<\\/script>/s);
if (!match) { console.error('Could not extract data'); process.exit(1); }
const data = JSON.parse(match[1]);
function walk(obj, results, depth=0) {
  if (!obj || typeof obj !== 'object' || depth > 30) return;
  if (obj.playlistVideoRenderer) {
    const r = obj.playlistVideoRenderer;
    results.push({ videoId: r.videoId, title: r.title?.runs?.[0]?.text || '', url: 'https://www.youtube.com/watch?v=' + r.videoId });
  }
  for (const v of Object.values(obj)) walk(v, results, depth+1);
}
const videos = []; walk(data, videos);
console.log(JSON.stringify(videos, null, 2));
"
```

Or use the project's scraper scripts:
```bash
node scripts/scrape-youtube-playlists.mjs  # Scrapes all channel playlist pages
node scripts/scrape-new-playlists.mjs      # Scrapes specific playlists (edit PLAYLISTS array first)
```

---

## Step 8: Register Playlists in `youtube-playlists-curated.json`

This is the critical wiring file at `scripts/youtube-playlists-curated.json`. It has three sections:

### 8a. Verify the channel exists

Check that the channel is in the `channels` array:
```json
{
  "channels": [
    { "id": "92pianokeys", "name": "92pianokeys", "playlistsUrl": "https://www.youtube.com/@92pianokeys40/playlists" },
    { "id": "amy-comparetto", "name": "Amy Comparetto", "playlistsUrl": "https://www.youtube.com/@AmyComparetto/playlists" },
    ...
  ]
}
```

If the channel isn't listed, **do not add new channels without user approval**. Only the five approved channels above are permitted.

### 8b. Add a playlist-to-book mapping

Add an entry to the `playlistBookMappings` array:

```json
{
  "channelId": "channel-id-from-channels-array",
  "channelName": "Channel Display Name",
  "playlistId": "PLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "playlistTitle": "Descriptive Playlist Title",
  "playlistUrl": "https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "bookId": "your-book-id",
  "tracks": [
    {
      "videoId": "xxxxxxxxxxx",
      "videoTitle": "Exact title from YouTube",
      "url": "https://www.youtube.com/watch?v=xxxxxxxxxxx"
    }
  ]
}
```

Each track in the `tracks` array must have the exact `videoTitle` as it appears on YouTube — the linker relies on these titles for fuzzy matching.

### 8c. Direct song links (when no playlist exists)

If a channel has individual videos (not in a playlist) for songs in the book, add entries to the `directSongLinks` array:

```json
{
  "channelId": "channel-id",
  "songId": "exact-song-id-from-songs-json",
  "url": "https://www.youtube.com/watch?v=xxxxxxxxxxx",
  "description": "Optional description"
}
```

Use `songId` for precise matching. Only use `bookId` + `songTitle` as a fallback.

---

## Step 9: Run the Linker

The linker reads `youtube-playlists-curated.json`, matches video titles to songs, and writes YouTube links into `songs.json`. It also auto-generates `book-playlists.json`.

### Dry run first

```bash
node scripts/link-youtube-playlists.mjs --dry-run
```

Review the output:
- **linksAdded**: New links that would be written
- **linksSkipped**: Duplicate links already present
- **unmatchedCount**: Videos that couldn't be matched to songs — investigate these
- **ambiguousCount**: Videos that matched multiple songs — may need disambiguation via page numbers or direct song links

### Apply links

```bash
node scripts/link-youtube-playlists.mjs
```

This writes updated `src/data/songs.json` and `src/data/book-playlists.json`.

---

## Step 10: Validate

### Run the curated data validator

```bash
node scripts/validate-curated.mjs
```

Must exit with code 0 (no errors). Warnings about redundant direct links are acceptable.

### Check coverage for the new book

```bash
node scripts/coverage-report.mjs --book your-book-id --missing
```

This shows:
- Total songs vs. songs with YouTube links
- Percentage coverage
- List of songs still missing links (with `--missing`)

### Detailed book check

```bash
node scripts/check-book.mjs your-book-id
```

Shows matched songs (✓), unmatched songs (✗), and unmatched playlist videos (?).

---

## Step 11: Build and Verify

```bash
npm run build
```

The build must complete successfully. It generates static pages for every book and song, so any broken references will cause build errors.

After a successful build, spot-check:
- The new book appears on the books index page
- The book detail page lists all songs
- Song detail pages show YouTube embeds (for linked songs)
- Difficulty badges display correctly
- Songs that appear in other books show an "Also in Other Books" section
- The book detail page shows an "Amazon ↗" link (if `amazonUrl` is set)

---

## Step 12: Link Duplicate Songs

Regenerate cross-book song links so that songs appearing in multiple books are linked together:

```bash
node scripts/link-duplicate-songs.mjs
```

This normalizes all song titles and groups matching songs across different books. It writes `src/data/song-links.json`, which the site reads at build time to display "Also in Other Books" on song detail pages.

Review the output:
- **Groups**: Number of unique songs that appear in 2+ books
- **Title variations**: Logged when matched songs have slightly different titles (e.g., parenthetical suffixes). Review these for false positives.
- **Largest groups**: Shows the most-duplicated songs and their books.

The script uses composer matching to avoid false positives (e.g., different "Minuet" pieces by different composers won't be linked).

After running, rebuild to include the updated links:

```bash
npm run build
```

---

## Step 13: Commit

```bash
git add src/data/books.json src/data/songs.json src/data/book-playlists.json src/data/song-links.json scripts/youtube-playlists-curated.json public/covers/{bookId}.jpg
git commit -m "Add {book title}"
```

Include any modified scripts if you edited them (e.g., adding playlists to `scrape-new-playlists.mjs`).

---

## Quick Reference: File Roles

| File | Purpose | Modified when |
|------|---------|---------------|
| `src/data/books.json` | All book metadata | Adding/editing a book |
| `src/data/songs.json` | All song metadata + YouTube links | Adding songs, running linker |
| `src/data/book-playlists.json` | Book → playlist mapping (auto-generated) | Running linker |
| `src/data/song-links.json` | Cross-book song links (auto-generated) | Running `link-duplicate-songs.mjs` |
| `src/data/difficulty-map.json` | Difficulty level reference | Rarely (only if scale changes) |
| `scripts/youtube-playlists-curated.json` | Curated YouTube channel/playlist/track data | Adding playlists or direct links |
| `public/covers/{bookId}.jpg` | Cover image | Adding a new book |

## Troubleshooting

### Linker reports many unmatched videos

The title normalization strips parentheses, brackets, diacritics, and common suffixes. If videos still don't match:
1. Check if the video title embeds the book name (the extractor handles common patterns like "Song - Piano Adventures Level 2A" or "Book 1, Page 22, Song Title").
2. Add a `directSongLink` with the exact `songId` for stubborn mismatches.
3. Check for composer disambiguation issues — the linker tries page number first, then composer from `[brackets]` or `Title - Composer (page N)` format.

### Cover image won't download

- Faber CDN requires the SKU (not the book ID). Check the product page URL for the SKU.
- Non-Faber books: download manually from Amazon or publisher and save as JPEG.
- Verify with `file public/covers/{bookId}.jpg` — must be "JPEG image data", not HTML.

### Build fails after adding songs

- Check that every song's `bookId` matches an existing book `id`.
- Check that song `id` values are unique.
- Check that `difficulty.label` is one of the six valid labels: `"Beginner"`, `"Early Intermediate"`, `"Intermediate"`, `"Late Intermediate"`, `"Early Advanced"`, `"Advanced"`.
- Ensure `youtubeLinks` is an array (even if empty: `[]`).
