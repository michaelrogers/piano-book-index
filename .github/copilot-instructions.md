# Piano Book Index — Copilot Instructions

This is a static reference site built with **Astro 4+** for indexing songs from piano method books (Faber Adult Piano Adventures, Alfred Greatest Hits, and others). It is deployed to **GitHub Pages**.

## Architecture

- **Framework**: Astro with static output (`output: 'static'`). NOT Next.js, NOT a SPA.
- **Interactive islands**: Preact `.tsx` components hydrated via `client:load` or `client:visible`.
- **Static components**: `.astro` files for everything that doesn't need client-side JS.
- **Styling**: Tailwind CSS v4 with dark mode via `dark:` classes (system preference).
- **Search**: Client-side fuzzy search via `fuse.js` in a Preact island.
- **Data**: Local JSON files in `src/data/` loaded at build time.
- **User state**: `localStorage` for book ownership, favorites, and practice status (no backend).
- **Favorites**: `fav:${songId}` keys in localStorage storing `{status, favoritedAt}`. Cross-component sync via `favorites-changed` custom event.

## File Structure

```
src/
  pages/         — Astro page routes (index, books, songs, difficulty, favorites)
  components/    — .astro (static) and .tsx (Preact islands)
  layouts/       — BaseLayout.astro (includes delegated click handlers for favorites)
  data/          — books.json, songs.json, difficulty-map.json
  lib/           — types.ts, data.ts
  styles/        — global.css (Tailwind)
public/
  covers/        — Book cover images
  manifest.json  — PWA manifest
scripts/         — Node.js utilities (YouTube scraping, coverage reports, data generation)
.github/
  workflows/     — GitHub Actions deploy to GitHub Pages
```

## Conventions

- Static components use `ComponentName.astro`; interactive islands use `ComponentName.tsx` (Preact).
- All data access goes through helper functions in `src/lib/data.ts`.
- Dynamic routes use `getStaticPaths()` for build-time page generation.
- TypeScript strict mode. Types are in `src/lib/types.ts`.
- To add books or songs: edit the JSON files in `src/data/`, push, and let CI rebuild.
- No decorative emojis — use inline SVGs for icons. Functional icons (♥, ✓, YouTube) are acceptable when tied to data.
- Favorite toggle uses delegated click handler via `[data-fav-toggle]` in BaseLayout — inline `onclick` handlers must NOT call `stopPropagation()`.
- Practice status hierarchy: want-to-learn → learning → practiced → mastered.

## Data Model

- **Book**: id, title, series, seriesLevel, publisher, isbn, coverImage, pageCount, description, amazonUrl
- **Song**: id, title, composer, arranger, genre, bookId, pageNumber, difficulty (Difficulty object), youtubeLinks (array of YouTubeLink), notes
- **Difficulty**: label (DifficultyLabel), faberLevel (nullable), alfredLevel (nullable)
- **DifficultyLabel**: "Beginner" | "Early Intermediate" | "Intermediate" | "Late Intermediate" | "Early Advanced" | "Advanced"
- **PracticeStatus**: "want-to-learn" | "learning" | "practiced" | "mastered"

## Key Decisions

- Data in JSON files, not a database — simple, version-controlled, easy to edit.
- User-specific state (owned books, notes) in `localStorage` — per-device, no auth needed.
- Favorites use `fav:${songId}` localStorage keys with `{status, favoritedAt}` values; synced via `favorites-changed` custom event.
- YouTube embeds are inline iframes (`youtube-nocookie.com`), lazy-loaded with `client:visible`.
- Difficulty uses a dual-scale: descriptive labels + optional Faber/Alfred native levels with a reference comparison page.
- Mobile-first design optimized for iPhone Safari with PWA manifest for "Add to Home Screen".
- Deployed to GitHub Pages via GitHub Actions on push to `main`.
