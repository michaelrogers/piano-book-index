import { useState, useEffect, useMemo } from 'preact/hooks';
import type { SongSearchItem, DifficultyLabel } from '../lib/types';
import type { PracticeStatus } from './FavoriteToggle';

interface FavoriteData {
  status: PracticeStatus;
  favoritedAt: number;
}

interface FavoriteSong extends SongSearchItem {
  favData: FavoriteData;
}

const STATUS_GROUPS: { status: PracticeStatus; label: string; emoji: string }[] = [
  { status: 'learning', label: 'Learning', emoji: '📖' },
  { status: 'want-to-learn', label: 'Want to Learn', emoji: '📋' },
  { status: 'practiced', label: 'Practiced', emoji: '✅' },
  { status: 'mastered', label: 'Mastered', emoji: '⭐' },
];

const STATUS_OPTIONS: { value: PracticeStatus; label: string; emoji: string }[] = [
  { value: 'want-to-learn', label: 'Want to Learn', emoji: '📋' },
  { value: 'learning', label: 'Learning', emoji: '📖' },
  { value: 'practiced', label: 'Practiced', emoji: '✅' },
  { value: 'mastered', label: 'Mastered', emoji: '⭐' },
];

const difficultyColors: Record<DifficultyLabel, string> = {
  'Beginner': 'text-green-700 dark:text-green-400',
  'Early Intermediate': 'text-yellow-700 dark:text-yellow-400',
  'Intermediate': 'text-orange-700 dark:text-orange-400',
  'Late Intermediate': 'text-red-700 dark:text-red-400',
  'Early Advanced': 'text-purple-700 dark:text-purple-400',
  'Advanced': 'text-pink-700 dark:text-pink-400',
};

interface Props {
  songs: SongSearchItem[];
}

function loadFavorites(): Map<string, FavoriteData> {
  const favs = new Map<string, FavoriteData>();
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('fav:')) continue;
    try {
      const data = JSON.parse(localStorage.getItem(key)!) as FavoriteData;
      favs.set(key.replace('fav:', ''), data);
    } catch { /* skip bad entries */ }
  }
  return favs;
}

export default function FavoritesList({ songs }: Props) {
  const [favMap, setFavMap] = useState<Map<string, FavoriteData>>(new Map());

  useEffect(() => {
    const reload = () => setFavMap(loadFavorites());
    reload();
    window.addEventListener('storage', reload);
    window.addEventListener('favorites-changed', reload as EventListener);
    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener('favorites-changed', reload as EventListener);
    };
  }, []);

  const changeStatus = (songId: string, newStatus: PracticeStatus) => {
    const existing = favMap.get(songId);
    const data: FavoriteData = { status: newStatus, favoritedAt: existing?.favoritedAt ?? Date.now() };
    localStorage.setItem(`fav:${songId}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('favorites-changed', { detail: { songId, status: newStatus, removed: false } }));
  };

  const removeFavorite = (songId: string) => {
    localStorage.removeItem(`fav:${songId}`);
    window.dispatchEvent(new CustomEvent('favorites-changed', { detail: { songId, status: null, removed: true } }));
  };

  const songMap = useMemo(() => {
    const m = new Map<string, SongSearchItem>();
    for (const s of songs) m.set(s.id, s);
    return m;
  }, [songs]);

  const grouped = useMemo(() => {
    const groups: Record<PracticeStatus, FavoriteSong[]> = {
      'learning': [],
      'want-to-learn': [],
      'practiced': [],
      'mastered': [],
    };
    for (const [songId, favData] of favMap) {
      const song = songMap.get(songId);
      if (!song) continue;
      groups[favData.status].push({ ...song, favData });
    }
    // Sort each group by favoritedAt (newest first)
    for (const key of Object.keys(groups) as PracticeStatus[]) {
      groups[key].sort((a, b) => b.favData.favoritedAt - a.favData.favoritedAt);
    }
    return groups;
  }, [favMap, songMap]);

  const totalFavorites = [...favMap.keys()].filter((id) => songMap.has(id)).length;

  if (totalFavorites === 0) {
    return (
      <div class="mt-12 text-center text-gray-500 dark:text-gray-400">
        <div class="text-4xl">♡</div>
        <p class="mt-3 text-lg">No favorites yet</p>
        <p class="mt-1 text-sm">
          Tap the heart icon on any song to start tracking your practice progress.
        </p>
        <a href="/" class="mt-4 inline-block rounded-lg bg-piano-600 px-4 py-2 text-sm font-medium text-white hover:bg-piano-700 dark:bg-piano-500 dark:hover:bg-piano-600">
          Browse Songs
        </a>
      </div>
    );
  }

  return (
    <div class="space-y-8">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {totalFavorites} {totalFavorites === 1 ? 'song' : 'songs'} favorited
      </p>

      {STATUS_GROUPS.map(({ status, label, emoji }) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <div key={status}>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {emoji} {label} ({items.length})
            </h2>
            <div class="mt-3 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {items.map((song) => (
                <div key={song.id} class="group">
                  <a
                    href={`/songs/${song.id}`}
                    class="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  >
                    <div class="shrink-0">
                      {song.bookCoverImage ? (
                        <img src={song.bookCoverImage} alt="" class="h-10 w-8 rounded object-cover shadow-sm" />
                      ) : (
                        <div class="flex h-10 w-8 items-center justify-center rounded bg-gray-100 text-xs dark:bg-gray-800">🎹</div>
                      )}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <h3 class="truncate text-sm font-medium text-gray-900 group-hover:text-piano-700 dark:text-gray-100 dark:group-hover:text-piano-400">
                          {song.title}
                        </h3>
                        {song.hasVideo && (
                          <svg class="h-3.5 w-3.5 shrink-0 text-red-500 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        )}
                      </div>
                      <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                        {song.composer} · {song.bookTitle}
                        {song.pageNumber && <span> · p.{song.pageNumber}</span>}
                        {song.difficultyLabel && (
                          <span class={`ml-1 ${difficultyColors[song.difficultyLabel]}`}>{song.difficultyLabel}</span>
                        )}
                      </p>
                    </div>
                  </a>
                  <div class="flex items-center gap-1 border-t border-gray-50 px-3 py-1.5 dark:border-gray-800/50">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => changeStatus(song.id, opt.value)}
                        class={`rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
                          song.favData.status === opt.value
                            ? 'border-piano-300 bg-piano-50 text-piano-700 dark:border-piano-700 dark:bg-piano-900/30 dark:text-piano-400'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700'
                        }`}
                      >
                        {opt.emoji} {opt.label}
                      </button>
                    ))}
                    <button
                      onClick={() => removeFavorite(song.id)}
                      class="ml-auto rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-gray-700 dark:text-gray-500 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Remove from favorites"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
