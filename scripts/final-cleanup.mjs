#!/usr/bin/env node
/**
 * Clean up incorrect playlist mappings
 */
import { readFileSync, writeFileSync } from 'fs';

const CURATED_PATH = 'scripts/youtube-playlists-curated.json';

// Patterns that indicate incorrect mappings
const INVALID_PATTERNS = [
  /Alfred's Basic Piano Library/i,  // These are for different books we don't have
  /Jazz, Rags.*Blues/i,  // Martha Mier books, not Faber PreTime
  /Alfred's Adult Christmas/i,  // Not Faber Christmas
  /Easy Piano Classics/i,  // Different book series
];

// Valid mappings by playlist title pattern -> expected bookId prefix
const VALID_MAPPINGS = {
  "Alfred's Greatest Hits Level 1": "alfred-greatest-hits-1",
  "Alfred's Greatest Hits Level 2": "alfred-greatest-hits-2",
};

const curated = JSON.parse(readFileSync(CURATED_PATH, 'utf8'));
const originalCount = curated.playlistBookMappings.length;

curated.playlistBookMappings = curated.playlistBookMappings.filter(m => {
  const title = m.playlistTitle;
  
  // Check if it matches known valid mappings
  if (VALID_MAPPINGS[title]) {
    return m.bookId === VALID_MAPPINGS[title];
  }
  
  // Check if it matches invalid patterns
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(title)) {
      console.log(`[remove] ${title} -> ${m.bookId}`);
      return false;
    }
  }
  
  // Keep Faber time-series playlists
  if (/^(Big|Chord|Show|Play|Pre|Fun)Time/i.test(title)) {
    return true;
  }
  
  // Keep Alfred's Greatest Hits
  if (/Alfred's Greatest Hits/i.test(title)) {
    return true;
  }
  
  console.log(`[remove] ${title} -> ${m.bookId} (unknown)`);
  return false;
});

const newCount = curated.playlistBookMappings.length;
console.log(`\nRemoved ${originalCount - newCount} invalid mappings`);
console.log(`Kept ${newCount} valid mappings`);

writeFileSync(CURATED_PATH, JSON.stringify(curated, null, 2));
