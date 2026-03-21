#!/usr/bin/env node
/**
 * Remove duplicate songs from the new books.
 * YouTube video titles sometimes have "Song, Composer" format
 * that creates duplicates with the Amazon-sourced entries.
 */
import { readFileSync, writeFileSync } from 'fs';

const songs = JSON.parse(readFileSync('src/data/songs.json', 'utf8'));

// IDs to remove (YouTube-only duplicates of Amazon entries)
const REMOVE_IDS = new Set([
  // Alfred Level 1 - YouTube extras that duplicate Amazon entries
  'aio1-the-can-can-offenbach',       // dupe of "The Can-Can"
  'aio1-happy-birthday',               // dupe of "Happy Birthday to You!"
  'aio1-kumbayah',                     // dupe of "Kum-ba-yah!"
  'aio1-money-cant-buy-evrything',     // dupe of "Money Can't Buy Everything"
  
  // Alfred Level 2 - YouTube extras that duplicate Amazon entries  
  'aio2-alexanders-ragtime-band-berlin',   // dupe of "Alexander's Ragtime Band"
  'aio2-bridal-chorus',                     // dupe of "Bridal Chorus from Lohengrin"
  'aio2-hungarian-rhapsody-no-2-liszt',     // dupe of "Hungarian Rhapsody No. 2"
  'aio2-loves-greeting-salut-damour-sir-edward-elgar', // dupe of "Love's Greeting"
  'aio2-plaisir-damour-martini',            // dupe of "Plaisir D'Amour"
  'aio2-solace-joplin',                     // dupe of "Solace"
  'aio2-waltz-in-g-minor-early-intermediate-piano-solo', // malformed dupe
  'aio2-waves-of-the-danube-ivanovici',     // dupe of "Waves of the Danube"
  'aio2-brahmss-lullaby',                   // dupe of "Brahms Lullaby"
  'aio2-etude-op-10-no-3',                  // dupe of "Etude"
  'aio2-the-polovetsian-dances-borodin',    // dupe of "Polovetsian Dances"
  'aio2-swinging-sevenths',                 // dupe of "Swingin' Sevenths"
  'aio2-overture-theme-from-raymond',       // dupe of 'Overture from "Raymond"'
  'aio2-light-blue',                        // dupe of "Light and Blue"
  'aio2-symphony-no-6',                     // dupe of "Theme from Symphony No. 6"
]);

// Also fix "Musette" -> check if it's actually "Musetta's Waltz"
// And "Festive Rondeau" might be separate from existing songs

const before = songs.length;

// First, find and list the actual IDs we want to remove
const newBookSongs = songs.filter(s => 
  s.bookId.startsWith('alfred-adult-aio') || s.bookId === 'library-of-easy-piano-classics'
);

console.log('Songs in new books before cleanup:');
for (const bookId of ['alfred-adult-aio-1', 'alfred-adult-aio-2', 'alfred-adult-aio-3', 'library-of-easy-piano-classics']) {
  const bs = songs.filter(s => s.bookId === bookId);
  console.log(`  ${bookId}: ${bs.length}`);
}

// Check which IDs actually exist
const actualIds = new Set(songs.map(s => s.id));
for (const id of REMOVE_IDS) {
  if (!actualIds.has(id)) {
    console.log(`  Warning: ID not found: ${id}`);
  }
}

const filtered = songs.filter(s => !REMOVE_IDS.has(s.id));
const removed = before - filtered.length;
console.log(`\nRemoved ${removed} duplicate songs`);

console.log('\nSongs in new books after cleanup:');
for (const bookId of ['alfred-adult-aio-1', 'alfred-adult-aio-2', 'alfred-adult-aio-3', 'library-of-easy-piano-classics']) {
  const bs = filtered.filter(s => s.bookId === bookId);
  console.log(`  ${bookId}: ${bs.length}`);
}

console.log(`\nTotal: ${filtered.length} songs`);
writeFileSync('src/data/songs.json', JSON.stringify(filtered, null, 2) + '\n');
console.log('Wrote cleaned songs.json');
