# YouTube Import Guide

Step-by-step workflow for adding a new YouTube channel or playlist to the Piano Book Index. This guide is written for AI agents and human developers.

## Prerequisites

- Node.js 22+ (`source ~/.nvm/nvm.sh && nvm use 22`)
- Working directory: project root (`/Users/michael/projects/piano-sheet` or equivalent)
- Read `docs/youtube-data-policy.md` for matching strategy details

## Quick Reference Commands

```bash
# Run linker (dry run)
node scripts/link-youtube-playlists.mjs --dry-run

# Run linker (for real — updates songs.json + book-playlists.json)
node scripts/link-youtube-playlists.mjs

# Validate curated.json references
node scripts/validate-curated.mjs

# Coverage report
node scripts/coverage-report.mjs
node scripts/coverage-report.mjs --missing              # show unlinked song titles
node scripts/coverage-report.mjs --book faber-classics-2 # filter to one book

# Build site
npx astro build
```

## Workflow: Adding a New YouTube Channel

### Step 1: Channel Discovery

Find the channel's playlists page:
```
https://www.youtube.com/@ChannelName/playlists
```

Use `curl` + `ytInitialData` extraction to list playlists:
```bash
curl -s 'https://www.youtube.com/@ChannelName/playlists' | \
  node -e "
    const html = require('fs').readFileSync('/dev/stdin','utf8');
    const m = html.match(/var ytInitialData = ({.*?});<\\/script>/s);
    const data = JSON.parse(m[1]);
    // Navigate to playlist renderers (format varies by channel):
    // - lockupViewModel (modern): data.contents.twoColumnBrowseResultsRenderer...
    // - gridPlaylistRenderer (legacy): similar path
    // Extract: playlistId, title, videoCount
  "
```

**Alternatively**, use the scraper to auto-discover:
```bash
node scripts/scrape-youtube-playlists.mjs
```
This scrapes all channels in curated.json and writes unmatched playlists to `scripts/youtube-unmatched-playlists.json`.

### Step 2: Register the Channel

Add to `scripts/youtube-playlists-curated.json` → `channels` array:
```json
{
  "id": "channel-slug",
  "name": "Display Name",
  "playlistsUrl": "https://www.youtube.com/@ChannelName/playlists"
}
```

### Step 3: Scrape Playlists

For each relevant playlist, fetch the video list. Each playlist entry in `playlistBookMappings` needs a `tracks` array:

```json
{
  "channelId": "channel-slug",
  "playlistId": "PLxxxxxxxx",
  "playlistTitle": "Playlist Display Name",
  "playlistUrl": "https://www.youtube.com/playlist?list=PLxxxxxxxx",
  "bookId": "faber-classics-1",
  "tracks": [
    {
      "videoId": "xxxxxxxxxxx",
      "videoTitle": "Original Video Title from YouTube",
      "url": "https://www.youtube.com/watch?v=xxxxxxxxxxx"
    }
  ]
}
```

Use `scrape-youtube-playlists.mjs` or fetch manually:
```bash
curl -s 'https://www.youtube.com/playlist?list=PLxxxxxxxx' | \
  node -e "
    const html = require('fs').readFileSync('/dev/stdin','utf8');
    const m = html.match(/var ytInitialData = ({.*?});<\\/script>/s);
    const data = JSON.parse(m[1]);
    const videos = data.contents.twoColumnBrowseResultsRenderer
      .tabs[0].tabRenderer.content.sectionListRenderer.contents[0]
      .itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
    const tracks = videos
      .filter(v => v.playlistVideoRenderer)
      .map(v => ({
        videoId: v.playlistVideoRenderer.videoId,
        videoTitle: v.playlistVideoRenderer.title.runs[0].text,
        url: 'https://www.youtube.com/watch?v=' + v.playlistVideoRenderer.videoId
      }));
    console.log(JSON.stringify(tracks, null, 2));
  "
```

**Note:** YouTube playlist pages use continuation-based loading. The initial HTML only contains the first ~100 videos. For longer playlists, you may need to handle continuation tokens.

### Step 4: Map Playlists to Books

Match each playlist to a `bookId` from `src/data/books.json`. Add the mapping to `curated.json` → `playlistBookMappings`.

To see all valid book IDs:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/books.json','utf8')).map(b=>b.id).join('\n'))"
```

### Step 5: Run the Linker (Dry Run)

```bash
node scripts/link-youtube-playlists.mjs --dry-run
```

Check the output for:
- **linksAdded**: new links that would be added
- **ambiguousCount**: should be 0 ideally (see Ambiguity Resolution below)
- **unmatchedCount**: videos that don't match any song (expected for bonus content)

### Step 6: Resolve Ambiguities

If `ambiguousCount > 0`, the output lists the problematic entries. See the **Ambiguity Resolution** section below.

### Step 7: Run for Real, Validate, Build

```bash
node scripts/link-youtube-playlists.mjs
node scripts/validate-curated.mjs
node scripts/coverage-report.mjs
npx astro build
```

### Step 8: Commit

```bash
git add scripts/youtube-playlists-curated.json src/data/songs.json src/data/book-playlists.json
git commit -m "Add [channel name] YouTube links"
```

---

## Workflow: Adding Standalone Videos (Direct Song Links)

Some channels have videos that aren't in playlists (e.g., Karen Rock Music's Adult PA standalone videos). To link these:

### Step 1: Find Videos

Use YouTube channel search:
```
https://www.youtube.com/@ChannelName/search?query=search+terms
```

### Step 2: Match to Songs

For each video, identify the target song in `src/data/songs.json` by title and book. Get the song's `id` field.

### Step 3: Add Direct Song Links

Add to `curated.json` → `directSongLinks`:
```json
{
  "channelId": "channel-slug",
  "songId": "faber-classics-1-theme-from-finlandia",
  "url": "https://www.youtube.com/watch?v=xxxxxxxxxxx",
  "description": "Brief description of the video source"
}
```

### Step 4: Run Linker, Validate, Build, Commit

Same as Steps 5-8 above.

---

## Ambiguity Resolution

When the linker finds multiple songs matching the same video title, it logs them as "ambiguous". Common causes and solutions:

### "Theme from X" / "Finale from X" Collisions

**Problem:** Multiple songs in the same book share the word "theme" or "finale" and match via the variant that strips "from ...".

**Solution cascade (handled automatically by the linker):**
1. **Page number**: If the video title contains `(page 34, ...)` or `, Page 62,`, the linker extracts the page number and matches against `song.pageNumber`. This resolves most cases.
2. **Composer**: If the video has `[Composer]` brackets or `Song - Composer (page...)` format, the linker extracts the composer and matches.
3. **Manual directSongLinks**: As a last resort, add a `directSongLink` with the explicit `songId`.

### Same Title, Different Arrangements (e.g., "Song of Joy" on pages 60 and 158)

**Problem:** The same piece appears twice in a book at different difficulty levels.

**Solution:** Page-number disambiguation (Strategy 1) resolves this automatically if the video title includes a page reference. The linker uses a ±5 page tolerance for fuzzy matching.

### Cross-Book Matches

**Problem:** A video from one book's playlist matches a song in a different book.

**Solution:** These should be `directSongLinks`, not playlist mappings. The linker only matches within the mapped book for playlist entries.

---

## Known Title Format Patterns by Channel

| Channel | Format | Example |
|---|---|---|
| 92pianokeys | `Song (Difficulty Level)` | `Love Me Tender (Elementary Piano Solo)` |
| Amy Comparetto | `Song (Series Genre)` | `Aladdin Medley (BigTime Piano Disney)` |
| Amy Comparetto | `Book, Page X, Song` | `Faber Adult Piano Adventures..., Page 22, O Sole Mio!` |
| Karen Rock Music | `Song [Composer] (Level Book)` | `Liebestraum [Liszt] (Level 5 Lesson Book)` |
| Let's Play Piano | `Song - PA Level Series Book` | `Can Can - Piano Adventures Level 2A PlayTime Piano Classics Book` |
| Piano Adventures | `Song - Composer (page X, Book)` | `Theme from Finlandia - Sibelius (page 34, Adult PA Classics 1)` |

---

## Coverage Gaps (as of last update)

Run `node scripts/coverage-report.mjs` for current numbers. Known gaps:
- **Christmas books**: No known YouTube channel covers these comprehensively
- **Music from China series**: No known YouTube source
- **Hymns series**: Partial coverage
- **faber-lesson-1 (35%)**: 92pianokeys covers it but many videos are unmatched — title formats may need new patterns
