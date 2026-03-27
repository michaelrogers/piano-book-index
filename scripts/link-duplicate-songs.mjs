#!/usr/bin/env node
// Finds songs with the same title across different books and generates song-links.json.
// Run after adding new books: node scripts/link-duplicate-songs.mjs

import { readFileSync, writeFileSync } from 'fs';

const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf-8'));

function normalizeTitle(title) {
  return title
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // strip accents
    .toLowerCase()
    .replace(/\(.*?\)/g, '')         // strip parenthetical suffixes
    .replace(/&/g, 'and')            // & → and
    .replace(/['']/g, '')            // strip apostrophes
    .replace(/^(the|a|an)\s+/i, '')  // strip leading articles
    .replace(/[^a-z0-9]+/g, ' ')     // collapse non-alphanum to space
    .trim();
}

const UNKNOWN_COMPOSERS = new Set(['', 'traditional', 'unknown']);

function normalizeComposer(composer) {
  const n = (composer || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return UNKNOWN_COMPOSERS.has(n) ? null : n;
}

// Group songs by normalized title
const titleGroups = new Map();
for (const song of songs) {
  const key = normalizeTitle(song.title);
  if (!key) continue;
  if (!titleGroups.has(key)) titleGroups.set(key, []);
  titleGroups.get(key).push(song);
}

// Split groups by composer when multiple distinct composers exist.
// Songs with unknown/empty composers only stay if there's exactly one known composer.
function splitByComposer(entries) {
  const knownComposers = new Set();
  for (const s of entries) {
    const nc = normalizeComposer(s.composer);
    if (nc) knownComposers.add(nc);
  }
  // 0 or 1 known composers — no ambiguity, keep the whole group
  if (knownComposers.size <= 1) return [entries];

  // Multiple known composers — split into sub-groups by composer.
  // Songs with unknown composers are excluded (ambiguous).
  const subGroups = new Map();
  for (const s of entries) {
    const nc = normalizeComposer(s.composer);
    if (!nc) continue; // exclude unknown-composer songs from split groups
    if (!subGroups.has(nc)) subGroups.set(nc, []);
    subGroups.get(nc).push(s);
  }
  return [...subGroups.values()];
}

// Filter to groups with 2+ songs from 2+ distinct books
const songLinks = {};
let totalGroups = 0;
let totalSongs = 0;
const parenStripped = [];

for (const [key, entries] of titleGroups) {
  for (const subGroup of splitByComposer(entries)) {
    const bookIds = new Set(subGroup.map(s => s.bookId));
    if (bookIds.size < 2) continue;

    // Use title key, append composer if this was a split group
    const ids = subGroup.map(s => s.id);
    songLinks[key] = songLinks[key] ? [...songLinks[key], ...ids] : ids;
    totalGroups++;
    totalSongs += subGroup.length;

    // Log title variations for review
    const titles = [...new Set(subGroup.map(s => s.title))];
    if (titles.length > 1) {
      parenStripped.push({ key, titles });
    }
  }
}

// Write output
const outPath = 'src/data/song-links.json';
writeFileSync(outPath, JSON.stringify(songLinks, null, 2) + '\n');

// Summary
console.log(`Song duplicate linker`);
console.log(`  Total songs scanned: ${songs.length}`);
console.log(`  Groups with cross-book duplicates: ${totalGroups}`);
console.log(`  Songs involved in duplicates: ${totalSongs}`);
console.log(`  Written to: ${outPath}`);

if (parenStripped.length > 0) {
  console.log(`\n  Title variations (review for false positives):`);
  for (const { key, titles } of parenStripped) {
    console.log(`    "${key}" → ${titles.map(t => `"${t}"`).join(', ')}`);
  }
}

// Show largest groups
const sorted = Object.entries(songLinks).sort((a, b) => b[1].length - a[1].length);
if (sorted.length > 0) {
  console.log(`\n  Largest groups:`);
  for (const [key, ids] of sorted.slice(0, 15)) {
    const bookIds = ids.map(id => songs.find(s => s.id === id)?.bookId);
    console.log(`    "${key}" (${ids.length}x): ${bookIds.join(', ')}`);
  }
}
