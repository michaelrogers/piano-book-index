# Publisher Data Sources

Source-of-truth references for obtaining and verifying book and song data. Song data in `src/data/songs.json` must originate from these official publisher sources — never from YouTube or third-party sites.

---

## Faber Piano Adventures (Hal Leonard)

**Publisher website:** https://pianoadventures.com

### Product Pages

Every Faber book has a product page at:

```
https://pianoadventures.com/product/{slug}/
```

The slug follows the pattern `{level}-piano-{style}`, e.g.:
- `pretime-piano-christmas`
- `bigtime-piano-popular`
- `showtime-piano-jazz-blues`
- `adult-piano-adventures-all-in-one-lesson-book-1` (Adult series)

### What's Available on Each Product Page

| Field | Location on Page | Extraction Method |
|---|---|---|
| Title | `<script type="application/ld+json">` → `name` | JSON-LD structured data |
| SKU | `<script type="application/ld+json">` → `sku` | JSON-LD structured data |
| ISBN | HTML table: `<th>isbn13</th>` → `<td><p>VALUE</p>` | Regex on HTML |
| Page count | HTML table: `<th>pages</th>` → `<td><p>VALUE</p>` | Regex on HTML |
| Cover image | `<script type="application/ld+json">` → `image` | JSON-LD structured data |
| Description | `<script type="application/ld+json">` → `description` | JSON-LD structured data |
| Song titles | Description text after "Contents include:" | Split on `•` bullet separator |

### Song Title Extraction

Song titles are embedded in the product description, not as structured data. The format is:

```
Contents include: Song One • Song Two • Song Three • Song Four.
```

Parsing rules (implemented in `scripts/scrape-pretime-bigtime.mjs`):
1. Find text after "Contents include:" (case-insensitive)
2. Split by `•` (bullet character, U+2022)
3. Trim whitespace and trailing periods
4. Decode HTML entities: `&bull;`, `&#8217;` (curly quotes), `&amp;`, etc.
5. Skip entries longer than 200 characters (description fragments, not song titles)
6. Stop before "More …Time Books" sections (cross-sell content)

### Series Coverage

| Series | Levels | URL Slug Pattern | Difficulty Range |
|---|---|---|---|
| PreTime Piano | Primer | `pretime-piano-{style}` | Beginner |
| PlayTime Piano | Level 1 | `playtime-piano-{style}` | Beginner |
| ShowTime Piano | Level 2A | `showtime-piano-{style}` | Early Intermediate |
| ChordTime Piano | Level 2B | `chordtime-piano-{style}` | Early Intermediate |
| FunTime Piano | Level 3A-3B | `funtime-piano-{style}` | Intermediate |
| BigTime Piano | Level 4 | `bigtime-piano-{style}` | Late Intermediate |
| AdvanceTime Piano | Level 3B-4 | `advancetime-piano-{style}` | Intermediate |
| Adult Piano Adventures | — | `adult-piano-adventures-*` | Various |

Available styles: `christmas`, `classics`, `disney`, `favorites`, `hits`, `hymns`, `jazz-blues`, `jewish-favorites`, `kids-songs`, `music-from-china`, `popular`, `ragtime-marches`, `rock-n-roll`, `faber-studio-collection`.

Not every level has every style. The scraper in `scripts/scrape-pretime-bigtime.mjs` iterates all combinations and skips 404s.

### Faber Adult Series

The Adult Piano Adventures books are **not scraped automatically** — their song lists were entered manually in `scripts/generate-songs.mjs`. These books include:
- Lesson Books 1 & 2
- Classics Books 1 & 2
- Popular Books 1 & 2
- Christmas Books 1 & 2
- Jazz Books 1 & 2
- Pop Books 1 & 2
- Motown Hits, Country Hits, Standards Book 1

Adult books also have product pages on `pianoadventures.com` but their song lists don't always appear in the description. Verify against the physical book table of contents or the Hal Leonard catalog (below).

### Hal Leonard Catalog (Alternate Lookup)

Faber books are distributed by Hal Leonard. Each book can also be looked up at:

```
https://www.halleonard.com/product/{isbn}
```

This can serve as a secondary verification source for ISBNs, page counts, and publication details. Song-level track listings are generally more complete on `pianoadventures.com`.

---

## Alfred Music

**Publisher website:** https://www.alfred.com

### Product Pages

Alfred books can be looked up by ISBN or title at:

```
https://www.alfred.com/search/?query={isbn-or-title}
```

Direct product pages follow this pattern:

```
https://www.alfred.com/{slug}/{product-id}/
```

However, Alfred product page URLs are not as predictable as Faber's. The most reliable lookup method is **search by ISBN**.

### Current Alfred Books in This Project

| Book | ISBN | Lookup URL |
|---|---|---|
| Greatest Hits Book 1 | 978-0739002810 | https://www.alfred.com/search/?query=978-0739002810 |
| Greatest Hits Book 2 | 978-0739002186 | https://www.alfred.com/search/?query=978-0739002186 |

### What's Available

Alfred product pages typically include:
- Title, author/arranger
- ISBN, page count
- Description (may include "Contents" section with song titles)
- Difficulty level
- Sample pages (PDF previews sometimes available)

### Song Title Extraction

Alfred does not use the same structured "Contents include: •" format as Faber. Track listings are:
- Sometimes in the product description as a plain list
- Sometimes only available in PDF sample pages or the physical book
- The Amazon listing for each book may have a "Table of Contents" in the editorial reviews

For the two Greatest Hits books currently in the project, songs were entered manually (see `scripts/generate-songs.mjs` which preserves Alfred songs from the existing dataset).

### Amazon as a Supplement

Each book's `amazonUrl` field links to its Amazon listing. Amazon "Look Inside" previews and editorial reviews sometimes expose the full table of contents when the publisher site doesn't. Use ISBNs for lookup:

```
https://www.amazon.com/dp/{ASIN}
```

Current ASINs:
- Greatest Hits 1: `0739002171`
- Greatest Hits 2: `073900218X`

---

## Verification Workflow

When an agent needs to verify or update song data:

1. **Identify the book's publisher** from `src/data/books.json` → `publisher` field.
2. **Look up the product page:**
   - Faber: `https://pianoadventures.com/product/{book-id}/`
   - Alfred: `https://www.alfred.com/search/?query={isbn}`
3. **Compare the track listing** from the product page against `src/data/songs.json` (filter by `bookId`).
4. **Report discrepancies** — missing songs, misspelled titles, wrong page numbers.
5. **Never add songs** from YouTube, forums, or other unofficial sources.

### Data Integrity Checks

To verify that song data hasn't drifted from official sources:

```bash
# Count songs per book
node -e 'var s=require("./src/data/songs.json"); var c={}; s.forEach(function(x){c[x.bookId]=(c[x.bookId]||0)+1}); console.log(JSON.stringify(c,null,2))'

# List songs for a specific book
node -e 'var s=require("./src/data/songs.json"); s.filter(function(x){return x.bookId==="pretime-piano-christmas"}).forEach(function(x){console.log(x.pageNumber, x.title)})'
```

Compare the output against the official product page to detect mutations.

---

## Key Scripts

| Script | Purpose | Data Source |
|---|---|---|
| `scripts/scrape-pretime-bigtime.mjs` | Scrapes Faber PreTime–BigTime books from pianoadventures.com | Faber website |
| `scripts/merge-pretime-bigtime.mjs` | Merges scraped Faber data into `src/data/` without overwriting existing entries | Local scraped JSON |
| `scripts/generate-songs.mjs` | Generates Faber Adult songs (manually defined) and preserves Alfred songs | Manual entry |
| `scripts/download-covers.mjs` | Downloads book cover images from pianoadventures.com | Faber website |

---

## Adding a New Publisher

To add books from a new publisher:

1. Add book entries to `src/data/books.json` with a distinct `publisher` value.
2. Add song entries to `src/data/songs.json` with the correct `bookId`.
3. Document the publisher's product page URL pattern in this file.
4. If the publisher has structured product pages, consider writing a scraper in `scripts/`.
5. Update `docs/youtube-data-policy.md` if a trusted YouTube channel covers the new publisher.
