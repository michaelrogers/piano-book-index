#!/usr/bin/env node
/**
 * Scrape specific YouTube playlists for the new books.
 * Extracts video titles from playlist pages.
 */
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PLAYLISTS = [
  { id: 'PLIx-hGjmqNJE9M_m1oMkNl8BRdATc1m8d', name: 'Alfred Adult AIO Level 1 (92PianoKeys)' },
  { id: 'PLIx-hGjmqNJEm1DLb4A6uYnrzJUl_tzCe', name: 'Alfred Adult AIO Level 2 (92PianoKeys)' },
  { id: 'PLIx-hGjmqNJH9V3NTh6g3jl7unuNUTQvt', name: 'Alfred Adult AIO Level 3 (92PianoKeys)' },
  { id: 'PL7ucElDiXf1QlJJ79ho-Svy9LWegYStIL', name: 'Easy Piano Classics Book One (Amy)' },
];

function fetchPage(url) {
  try {
    return execSync(
      `curl -s -L --max-time 30 -A '${USER_AGENT}' '${url}'`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 20 }
    );
  } catch (e) {
    console.error(`Failed to fetch: ${url}`, e.message);
    return null;
  }
}

function extractPlaylistVideos(html) {
  const videos = [];
  
  // Try to extract ytInitialData
  let data = null;
  const match = html.match(/var ytInitialData = ({.+?});/s) 
    || html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
  if (match) {
    try { data = JSON.parse(match[1]); } catch(e) {}
  }
  
  if (data) {
    // Walk the data structure to find video entries
    function walk(obj, depth = 0) {
      if (!obj || typeof obj !== 'object' || depth > 30) return;
      
      // playlistVideoRenderer is the standard format
      if (obj.playlistVideoRenderer) {
        const r = obj.playlistVideoRenderer;
        const videoId = r.videoId;
        const title = r.title?.runs?.[0]?.text || r.title?.simpleText || '';
        const index = parseInt(r.index?.simpleText || '0', 10);
        if (videoId && title) {
          videos.push({ videoId, title, index, url: `https://www.youtube.com/watch?v=${videoId}` });
        }
      }
      
      // Also check playlistPanelVideoRenderer
      if (obj.playlistPanelVideoRenderer) {
        const r = obj.playlistPanelVideoRenderer;
        const videoId = r.videoId;
        const title = r.title?.runs?.[0]?.text || r.title?.simpleText || '';
        if (videoId && title) {
          videos.push({ videoId, title, index: videos.length + 1, url: `https://www.youtube.com/watch?v=${videoId}` });
        }
      }
      
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) walk(item, depth + 1);
        } else if (typeof obj[key] === 'object') {
          walk(obj[key], depth + 1);
        }
      }
    }
    walk(data);
  }
  
  // Fallback: regex-based extraction from HTML
  if (videos.length === 0) {
    const re = /"videoId":"([^"]+)"[^}]*?"text":"([^"]+)"/g;
    let m;
    const seen = new Set();
    while ((m = re.exec(html)) !== null) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        videos.push({ videoId: m[1], title: m[2], index: videos.length + 1, url: `https://www.youtube.com/watch?v=${m[1]}` });
      }
    }
  }
  
  return videos;
}

const results = {};

for (const pl of PLAYLISTS) {
  console.log(`\nScraping: ${pl.name} (${pl.id})...`);
  const url = `https://www.youtube.com/playlist?list=${pl.id}`;
  const html = fetchPage(url);
  if (!html) {
    console.error(`  Failed to fetch playlist`);
    results[pl.id] = [];
    continue;
  }
  
  const videos = extractPlaylistVideos(html);
  // Deduplicate by videoId
  const seen = new Set();
  const unique = videos.filter(v => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
  
  console.log(`  Found ${unique.length} videos`);
  results[pl.id] = unique;
  
  // Print first few
  for (const v of unique.slice(0, 5)) {
    console.log(`    ${v.index}. ${v.title}`);
  }
  if (unique.length > 5) console.log(`    ... and ${unique.length - 5} more`);
}

writeFileSync('/tmp/new-playlist-videos.json', JSON.stringify(results, null, 2));
console.log('\nWrote results to /tmp/new-playlist-videos.json');
