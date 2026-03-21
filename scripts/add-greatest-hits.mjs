#!/usr/bin/env node
/**
 * Add Alfred's Greatest Hits playlists with video tracks
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const CURATED_PATH = 'scripts/youtube-playlists-curated.json';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const manualMappings = [
  {
    channelId: "92pianokeys",
    channelName: "92pianokeys",
    playlistId: "PLIx-hGjmqNJH3_R1-VFSuqHNBwTiW9cAn",
    playlistTitle: "Alfred's Greatest Hits Level 1",
    bookId: "alfred-greatest-hits-1"
  },
  {
    channelId: "92pianokeys",
    channelName: "92pianokeys",
    playlistId: "PLIx-hGjmqNJGepF4pv83jakxJY5N_A1Ua",
    playlistTitle: "Alfred's Greatest Hits Level 2",
    bookId: "alfred-greatest-hits-2"
  }
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
      for (const item of obj) findVideos(item, depth + 1);
    } else {
      for (const key of Object.keys(obj)) findVideos(obj[key], depth + 1);
    }
  }
  
  findVideos(data);
  return videos;
}

const curated = JSON.parse(readFileSync(CURATED_PATH, 'utf8'));
const existingIds = new Set((curated.playlistBookMappings || []).map(m => m.playlistId));

for (const mapping of manualMappings) {
  if (existingIds.has(mapping.playlistId)) {
    console.log(`[skip] ${mapping.playlistTitle} already mapped`);
    continue;
  }
  
  console.log(`[fetch] ${mapping.playlistTitle}...`);
  const videos = fetchPlaylistVideos(mapping.playlistId);
  console.log(`  Found ${videos.length} videos`);
  
  curated.playlistBookMappings.push({
    channelId: mapping.channelId,
    channelName: mapping.channelName,
    playlistId: mapping.playlistId,
    playlistTitle: mapping.playlistTitle,
    playlistUrl: `https://www.youtube.com/playlist?list=${mapping.playlistId}`,
    bookId: mapping.bookId,
    tracks: videos
  });
}

writeFileSync(CURATED_PATH, JSON.stringify(curated, null, 2));
console.log('[done] Updated curated JSON');
