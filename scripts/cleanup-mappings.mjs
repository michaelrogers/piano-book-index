#!/usr/bin/env node
/**
 * Clean up curated playlists - remove incorrectly mapped playlists
 */
import { readFileSync, writeFileSync } from 'fs';

const CURATED_PATH = 'scripts/youtube-playlists-curated.json';

// Only keep these playlist IDs - these are correctly mapped
const VALID_MAPPINGS = new Set([
  "PLIx-hGjmqNJH3_R1-VFSuqHNBwTiW9cAn", // Alfred's Greatest Hits Level 1 -> alfred-greatest-hits-1
  "PLIx-hGjmqNJGepF4pv83jakxJY5N_A1Ua", // Alfred's Greatest Hits Level 2 -> alfred-greatest-hits-2
]);

const curated = JSON.parse(readFileSync(CURATED_PATH, 'utf8'));
const originalCount = curated.playlistBookMappings.length;

// Filter to only valid mappings
curated.playlistBookMappings = curated.playlistBookMappings.filter(m => 
  VALID_MAPPINGS.has(m.playlistId)
);

const newCount = curated.playlistBookMappings.length;
console.log(`Removed ${originalCount - newCount} invalid mappings`);
console.log(`Kept ${newCount} valid mappings`);

writeFileSync(CURATED_PATH, JSON.stringify(curated, null, 2));
console.log('Updated curated JSON');
