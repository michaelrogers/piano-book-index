#!/usr/bin/env node
/**
 * Add Amy Comparetto's Faber time-series playlists
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const CURATED_PATH = 'scripts/youtube-playlists-curated.json';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

// Map of playlist name patterns to book IDs
const FABER_TIME_SERIES = {
  'bigtime-piano': {
    'classics': 'bigtime-piano-classics',
    'disney': 'bigtime-piano-disney',
    'favorites': 'bigtime-piano-favorites',
    'hits': 'bigtime-piano-hits',
    'hymns': 'bigtime-piano-hymns',
    'jazz': 'bigtime-piano-jazz-blues',
    'popular': 'bigtime-piano-popular',
    'ragtime': 'bigtime-piano-ragtime-marches',
    'rock': 'bigtime-piano-rock-n-roll',
    'christmas': 'bigtime-piano-christmas',
    'kids': 'bigtime-piano-kids-songs',
  },
  'chordtime-piano': {
    'classics': 'chordtime-piano-classics',
    'disney': 'chordtime-piano-disney',
    'favorites': 'chordtime-piano-favorites',
    'hits': 'chordtime-piano-hits',
    'hymns': 'chordtime-piano-hymns',
    'jazz': 'chordtime-piano-jazz-blues',
    'popular': 'chordtime-piano-popular',
    'ragtime': 'chordtime-piano-ragtime-marches',
    'rock': 'chordtime-piano-rock-n-roll',
    'christmas': 'chordtime-piano-christmas',
    'kids': 'chordtime-piano-kids-songs',
  },
  'showtime-piano': {
    'classics': 'showtime-piano-classics',
    'disney': 'showtime-piano-disney',
    'favorites': 'showtime-piano-favorites',
    'hits': 'showtime-piano-hits',
    'hymns': 'showtime-piano-hymns',
    'jazz': 'showtime-piano-jazz-blues',
    'popular': 'showtime-piano-popular',
    'rock': 'showtime-piano-rock-n-roll',
    'christmas': 'showtime-piano-christmas',
    'kids': 'showtime-piano-kids-songs',
  },
  'playtime-piano': {
    'classics': 'playtime-piano-classics',
    'disney': 'playtime-piano-disney',
    'favorites': 'playtime-piano-favorites',
    'hymns': 'playtime-piano-hymns',
    'jazz': 'playtime-piano-jazz-blues',
    'popular': 'playtime-piano-popular',
    'rock': 'playtime-piano-rock-n-roll',
    'christmas': 'playtime-piano-christmas',
    'kids': 'playtime-piano-kids-songs',
  },
  'pretime-piano': {
    'classics': 'pretime-piano-classics',
    'disney': 'pretime-piano-disney',
    'favorites': 'pretime-piano-favorites',
    'hymns': 'pretime-piano-hymns',
    'jazz': 'pretime-piano-jazz-blues',
    'popular': 'pretime-piano-popular',
    'rock': 'pretime-piano-rock-n-roll',
    'christmas': 'pretime-piano-christmas',
    'kids': 'pretime-piano-kids-songs',
  },
  'funtime-piano': {
    'classics': 'funtime-piano-classics',
    'disney': 'funtime-piano-disney',
    'favorites': 'funtime-piano-favorites',
    'hits': 'funtime-piano-hits',
    'hymns': 'funtime-piano-hymns',
    'jazz': 'funtime-piano-jazz-blues',
    'popular': 'funtime-piano-popular',
    'ragtime': 'funtime-piano-ragtime-marches',
    'rock': 'funtime-piano-rock-n-roll',
    'christmas': 'funtime-piano-christmas',
    'kids': 'funtime-piano-kids-songs',
  },
};

function fetchPage(url) {
  try {
    const html = execSync(
      `curl -s -L --max-time 30 -A '${USER_AGENT}' '${url}'`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 20 }
    );
    return html;
  } catch (e) {
    console.error(`[fetch] Failed: ${url}`, e.message);
    return null;
  }
}

function extractYtInitialData(html) {
  const match = html.match(/var ytInitialData = ({.+?});/s);
  if (!match) {
    const altMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
    if (altMatch) {
      try { return JSON.parse(altMatch[1]); } catch (e) { return null; }
    }
    return null;
  }
  try { return JSON.parse(match[1]); } catch (e) { return null; }
}

function extractPlaylistsFromSearch(data) {
  const playlists = [];
  
  function find(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 25) return;
    
    if (obj.playlistRenderer) {
      const r = obj.playlistRenderer;
      const title = r.title?.simpleText || r.title?.runs?.[0]?.text || '';
      const id = r.playlistId;
      if (id && title) playlists.push({ id, title });
    }
    
    if (obj.lockupViewModel) {
      const vm = obj.lockupViewModel;
      const title = vm.metadata?.lockupMetadataViewModel?.title?.content || '';
      const id = vm.contentId;
      if (id && title) playlists.push({ id, title });
    }
    
    if (Array.isArray(obj)) {
      obj.forEach(i => find(i, depth + 1));
    } else {
      Object.values(obj).forEach(v => find(v, depth + 1));
    }
  }
  
  find(data);
  
  const seen = new Set();
  return playlists.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function fetchPlaylistVideos(playlistId) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const html = fetchPage(url);
  if (!html) return [];
  
  const data = extractYtInitialData(html);
  if (!data) return [];
  
  const videos = [];
  
  function findVideos(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 20) return;
    
    if (obj.playlistVideoRenderer) {
      const renderer = obj.playlistVideoRenderer;
      const videoId = renderer.videoId;
      const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || '';
      if (videoId && title) {
        videos.push({ videoId, videoTitle: title, url: `https://www.youtube.com/watch?v=${videoId}` });
      }
    }
    
    if (Array.isArray(obj)) {
      obj.forEach(i => findVideos(i, depth + 1));
    } else {
      Object.values(obj).forEach(v => findVideos(v, depth + 1));
    }
  }
  
  findVideos(data);
  return videos;
}

function matchPlaylistToBook(title) {
  const lower = title.toLowerCase().replace(/['']/g, "'").replace(/&/g, 'and');
  
  // Pattern: "BigTime Disney" or "BigTime Piano Disney" -> bigtime-piano-disney
  const timeSeriesMatch = lower.match(/^(bigtime|chordtime|showtime|playtime|pretime|funtime)\s*(?:piano\s*)?(.*)/i);
  
  if (!timeSeriesMatch) return null;
  
  const series = timeSeriesMatch[1].toLowerCase();
  const category = timeSeriesMatch[2].trim().toLowerCase();
  
  const seriesKey = `${series}-piano`;
  const categories = FABER_TIME_SERIES[seriesKey];
  
  if (!categories) return null;
  
  // Match category keywords
  for (const [keyword, bookId] of Object.entries(categories)) {
    if (category.includes(keyword)) {
      return bookId;
    }
  }
  
  return null;
}

async function main() {
  const curated = JSON.parse(readFileSync(CURATED_PATH, 'utf8'));
  const existingIds = new Set((curated.playlistBookMappings || []).map(m => m.playlistId));
  
  const searches = ['BigTime', 'ChordTime', 'ShowTime', 'PlayTime', 'PreTime', 'FunTime'];
  const allPlaylists = [];
  
  for (const term of searches) {
    console.log(`[search] Searching for ${term}...`);
    const url = `https://www.youtube.com/@AmyComparetto/search?query=${term}`;
    const html = fetchPage(url);
    if (!html) continue;
    
    const data = extractYtInitialData(html);
    if (!data) continue;
    
    const playlists = extractPlaylistsFromSearch(data);
    console.log(`  Found ${playlists.length} playlists`);
    
    for (const p of playlists) {
      if (!existingIds.has(p.id)) {
        allPlaylists.push(p);
        existingIds.add(p.id);
      }
    }
  }
  
  console.log(`\n[process] Found ${allPlaylists.length} new playlists to process`);
  
  let added = 0;
  let skipped = 0;
  
  for (const playlist of allPlaylists) {
    const bookId = matchPlaylistToBook(playlist.title);
    
    if (!bookId) {
      console.log(`  [skip] ${playlist.title} - no book match`);
      skipped++;
      continue;
    }
    
    console.log(`  [fetch] ${playlist.title} -> ${bookId}`);
    const videos = fetchPlaylistVideos(playlist.id);
    console.log(`    Got ${videos.length} videos`);
    
    if (videos.length === 0) {
      console.log(`    Skipping - no videos`);
      skipped++;
      continue;
    }
    
    curated.playlistBookMappings.push({
      channelId: 'amy-comparetto',
      channelName: 'Amy Comparetto',
      playlistId: playlist.id,
      playlistTitle: playlist.title,
      playlistUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
      bookId,
      tracks: videos,
    });
    
    added++;
  }
  
  writeFileSync(CURATED_PATH, JSON.stringify(curated, null, 2));
  console.log(`\n[done] Added ${added} playlists, skipped ${skipped}`);
}

main();
