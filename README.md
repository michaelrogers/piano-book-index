# Piano Book Index

A personal reference site for indexing songs across piano method books. Browse by book, search by song title or composer, track practice progress, and find YouTube tutorials — all in one place.

## What it does

- **Book catalog** — Browse and filter books by publisher, series, and difficulty level. Mark which books you own.
- **Song index** — Search 1,300+ songs across 96 books with fuzzy search by title, composer, or genre.
- **YouTube links** — Embedded tutorial videos matched to individual songs from trusted piano channels.
- **Practice tracking** — Favorite songs and track your progress: want to learn, learning, practiced, mastered.
- **Difficulty reference** — Compare difficulty scales across Faber, Alfred, and other publishers.

## Tech

Static site built with Astro and deployed to Cloudflare Pages. All data lives in JSON files — no backend, no database. User state (owned books, favorites) stored in localStorage.
