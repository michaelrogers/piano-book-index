#!/usr/bin/env node
/**
 * Scrape YouTube playlists from channel pages and match to books
 * Usage: node scripts/scrape-youtube-playlists.mjs
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const CURATED_PATH = 'scripts/youtube-playlists-curated.json';
const BOOKS_PATH = 'src/data/books.json';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
  // YouTube embeds page data in ytInitialData variable
  const match = html.match(/var ytInitialData = ({.+?});/s);
  if (!match) {
    // Try alternate pattern
    const altMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
    if (altMatch) {
      try {
        return JSON.parse(altMatch[1]);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return null;
  }
}

function extractPlaylistsFromChannelPage(data) {
  const playlists = [];
  
  // Navigate the nested structure to find playlist items
  // YouTube now uses lockupViewModel for playlist items
  function findPlaylists(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 25) return;
    
    // New structure: lockupViewModel contains playlist data
    if (obj.lockupViewModel) {
      const vm = obj.lockupViewModel;
      const meta = vm.metadata?.lockupMetadataViewModel;
      const title = meta?.title?.content || '';
      const playlistId = vm.contentId || '';
      // Video count is in the metadata subtitle or overlays
      const videoCountText = meta?.metadata?.contentMetadataViewModelOne?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content || '';
      const videoCount = parseInt(videoCountText.match(/(\d+)/)?.[1] || '0', 10);
      
      if (playlistId && title) {
        playlists.push({ playlistId, title, videoCount });
      }
    }
    
    // Old structure fallback: gridPlaylistRenderer or playlistRenderer
    if (obj.gridPlaylistRenderer) {
      const renderer = obj.gridPlaylistRenderer;
      const playlistId = renderer.playlistId;
      const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || '';
      const videoCount = parseInt(renderer.videoCountShortText?.simpleText || renderer.videoCountText?.runs?.[0]?.text || '0', 10);
      if (playlistId && title) {
        playlists.push({ playlistId, title, videoCount });
      }
    }
    
    if (obj.playlistRenderer) {
      const renderer = obj.playlistRenderer;
      const playlistId = renderer.playlistId;
      const title = renderer.title?.simpleText || renderer.title?.runs?.[0]?.text || '';
      const videoCount = parseInt(renderer.videoCount || '0', 10);
      if (playlistId && title) {
        playlists.push({ playlistId, title, videoCount });
      }
    }

    // Recursively search
    if (Array.isArray(obj)) {
      for (const item of obj) {
        findPlaylists(item, depth + 1);
      }
    } else {
      for (const key of Object.keys(obj)) {
        findPlaylists(obj[key], depth + 1);
      }
    }
  }
  
  findPlaylists(data);
  
  // Deduplicate by playlistId
  const seen = new Set();
  return playlists.filter(p => {
    if (seen.has(p.playlistId)) return false;
    seen.add(p.playlistId);
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
        videos.push({
          videoId,
          title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }
    }
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        findVideos(item, depth + 1);
      }
    } else {
      for (const key of Object.keys(obj)) {
        findVideos(obj[key], depth + 1);
      }
    }
  }
  
  findVideos(data);
  return videos;
}

function normalizeTitle(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchPlaylistToBook(playlistTitle, books) {
  const normalizedPlaylist = normalizeTitle(playlistTitle);
  
  // Score each book by how well it matches
  let bestMatch = null;
  let bestScore = 0;
  
  for (const book of books) {
    const normalizedBook = normalizeTitle(book.title);
    const bookWords = normalizedBook.split(' ').filter(w => w.length > 2);
    const playlistWords = normalizedPlaylist.split(' ').filter(w => w.length > 2);
    
    // Count matching words
    let matchingWords = 0;
    for (const word of bookWords) {
      if (playlistWords.includes(word)) {
        matchingWords++;
      }
    }
    
    // Score based on percentage of book words matched
    const score = bookWords.length > 0 ? matchingWords / bookWords.length : 0;
    
    // Require at least 50% word match and some absolute matches
    if (score > bestScore && score >= 0.5 && matchingWords >= 2) {
      bestScore = score;
      bestMatch = book;
    }
  }
  
  return bestMatch;
}

async function main() {
  console.log('[yt:scrape] Loading existing data...');
  const curated = JSON.parse(readFileSync(CURATED_PATH, 'utf8'));
  const books = JSON.parse(readFileSync(BOOKS_PATH, 'utf8'));
  
  const channels = curated.channels || [];
  const existingMappings = new Map(
    (curated.playlistBookMappings || []).map(m => [m.playlistId, m])
  );
  
  const newMappings = [];
  const unmatchedPlaylists = [];
  
  for (const channel of channels) {
    console.log(`\n[yt:scrape] Fetching playlists for ${channel.name}...`);
    const html = fetchPage(channel.playlistsUrl);
    if (!html) {
      console.error(`[yt:scrape] Failed to fetch ${channel.playlistsUrl}`);
      continue;
    }
    
    const data = extractYtInitialData(html);
    if (!data) {
      console.error(`[yt:scrape] Failed to parse ytInitialData for ${channel.name}`);
      continue;
    }
    
    const playlists = extractPlaylistsFromChannelPage(data);
    console.log(`[yt:scrape] Found ${playlists.length} playlists`);
    
    for (const playlist of playlists) {
      // Skip if already mapped
      if (existingMappings.has(playlist.playlistId)) {
        console.log(`  [skip] ${playlist.title} (already mapped)`);
        continue;
      }
      
      // Try to match to a book
      const matchedBook = matchPlaylistToBook(playlist.title, books);
      
      if (matchedBook) {
        console.log(`  [match] "${playlist.title}" -> ${matchedBook.id}`);
        
        // Fetch videos in playlist
        console.log(`    Fetching ${playlist.videoCount} videos...`);
        const videos = fetchPlaylistVideos(playlist.playlistId);
        console.log(`    Got ${videos.length} videos`);
        
        newMappings.push({
          channelId: channel.id,
          channelName: channel.name,
          playlistId: playlist.playlistId,
          playlistTitle: playlist.title,
          playlistUrl: `https://www.youtube.com/playlist?list=${playlist.playlistId}`,
          bookId: matchedBook.id,
          tracks: videos.map(v => ({
            videoId: v.videoId,
            videoTitle: v.title,
            url: v.url,
          })),
        });
      } else {
        console.log(`  [unmatched] ${playlist.title}`);
        unmatchedPlaylists.push({
          channelId: channel.id,
          channelName: channel.name,
          playlistId: playlist.playlistId,
          playlistTitle: playlist.title,
        });
      }
    }
  }
  
  // Merge with existing mappings
  const allMappings = [...curated.playlistBookMappings || [], ...newMappings];
  
  // Update curated file
  const updated = {
    ...curated,
    playlistBookMappings: allMappings,
  };
  
  writeFileSync(CURATED_PATH, JSON.stringify(updated, null, 2));
  console.log(`\n[yt:scrape] Saved ${newMappings.length} new playlist mappings`);
  
  if (unmatchedPlaylists.length > 0) {
    console.log(`\n[yt:scrape] Unmatched playlists (${unmatchedPlaylists.length}):`);
    for (const p of unmatchedPlaylists) {
      console.log(`  - [${p.channelName}] ${p.playlistTitle}`);
    }
    
    // Save unmatched for manual review
    writeFileSync(
      'scripts/youtube-unmatched-playlists.json',
      JSON.stringify(unmatchedPlaylists, null, 2)
    );
    console.log('  Saved to scripts/youtube-unmatched-playlists.json for manual review');
  }
  
  console.log('\n[yt:scrape] Done! Run `node scripts/link-youtube-playlists.mjs` to link songs.');
}

main().catch(console.error);
