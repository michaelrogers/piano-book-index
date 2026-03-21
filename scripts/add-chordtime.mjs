#!/usr/bin/env node
/**
 * Add missing ChordTime playlists from Amy Comparetto
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const CURATED_PATH = 'scripts/youtube-playlists-curated.json';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

// Missing ChordTime playlists to add
const MISSING_PLAYLISTS = [
  { search: 'chordtime+classics', bookId: 'chordtime-piano-classics' },
  { search: 'chordtime+disney', bookId: 'chordtime-piano-disney' },
  { search: 'chordtime+favorites', bookId: 'chordtime-piano-favorites' },
  { search: 'chordtime+hits', bookId: 'chordtime-piano-hits' },
  { search: 'chordtime+hymns', bookId: 'chordtime-piano-hymns' },
  { search: 'chordtime+jazz', bookId: 'chordtime-piano-jazz-blues' },
  { search: 'chordtime+popular', bookId: 'chordtime-piano-popular' },
  { search: 'chordtime+christmas', bookId: 'chordtime-piano-christmas' },
  { search: 'chordtime+kids', bookId: 'chordtime-piano-kids-songs' },
];

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

function findPlaylistInSearch(html) {
  const match = html.match(/"playlistId":"([^"]+)"/);
  return match ? match[1] : null;
}

function findPlaylistTitle(html, playlistId) {
  // Try to find the title near the playlist ID
  const titleMatch = html.match(new RegExp(`"playlistId":"${playlistId}"[^}]*"title":\\{[^}]*"simpleText":"([^"]+)"`));
  if (titleMatch) return titleMatch[1];
  
  // Fall back to finding any ChordTime title
  const fallback = html.match(/"simpleText":"(ChordTime[^"]+)"/);
  return fallback ? fallback[1] : null;
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

async function main() {
  const curated = JSON.parse(readFileSync(CURATED_PATH, 'utf8'));
  const existingIds = new Set((curated.playlistBookMappings || []).map(m => m.playlistId));
  const existingBookIds = new Set((curated.playlistBookMappings || []).map(m => m.bookId));
  
  let added = 0;
  
  for (const item of MISSING_PLAYLISTS) {
    // Skip if we already have this book mapped
    if (existingBookIds.has(item.bookId)) {
      console.log(`[skip] ${item.bookId} - already mapped`);
      continue;
    }
    
    console.log(`[search] ${item.search}...`);
    const url = `https://www.youtube.com/results?search_query=amy+comparetto+${item.search}`;
    const html = fetchPage(url);
    if (!html) continue;
    
    const playlistId = findPlaylistInSearch(html);
    if (!playlistId) {
      console.log(`  No playlist found`);
      continue;
    }
    
    if (existingIds.has(playlistId)) {
      console.log(`  Playlist ${playlistId} already exists`);
      continue;
    }
    
    const title = findPlaylistTitle(html, playlistId);
    console.log(`  Found: ${title || playlistId}`);
    
    const videos = fetchPlaylistVideos(playlistId);
    console.log(`  Got ${videos.length} videos`);
    
    if (videos.length === 0) continue;
    
    curated.playlistBookMappings.push({
      channelId: 'amy-comparetto',
      channelName: 'Amy Comparetto',
      playlistId,
      playlistTitle: title || `ChordTime ${item.search}`,
      playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
      bookId: item.bookId,
      tracks: videos,
    });
    
    existingIds.add(playlistId);
    existingBookIds.add(item.bookId);
    added++;
  }
  
  writeFileSync(CURATED_PATH, JSON.stringify(curated, null, 2));
  console.log(`\n[done] Added ${added} playlists`);
}

main();
