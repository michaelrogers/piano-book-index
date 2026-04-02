import { useEffect, useState } from 'preact/hooks';
import type { PracticeStatus } from './FavoriteToggle';

interface SongSummary {
  id: string;
  title: string;
  composer: string;
  bookTitle: string;
  difficultyLabel: string;
  bookCoverImage: string;
}

interface Props {
  totalBooks: number;
}

interface FavEntry {
  songId: string;
  status: PracticeStatus;
  favoritedAt: number;
}

const statusLabel: Record<PracticeStatus, string> = {
  'want-to-learn': 'Want to Learn',
  'learning': 'Learning',
  'practiced': 'Practiced',
  'mastered': 'Mastered',
};

const statusColors: Record<PracticeStatus, string> = {
  'want-to-learn': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'learning': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'practiced': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'mastered': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export default function HomeDashboard({ totalBooks }: Props) {
  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [favorites, setFavorites] = useState<FavEntry[]>([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [randomSongs, setRandomSongs] = useState<SongSummary[]>([]);

  // Fetch song summaries from static JSON endpoint
  useEffect(() => {
    fetch('/api/song-summaries.json')
      .then((r) => r.json())
      .then((data: SongSummary[]) => setSongs(data));
  }, []);

  const loadState = () => {
    const favs: FavEntry[] = [];
    let owned = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('fav:')) {
        try {
          const val = JSON.parse(localStorage.getItem(key)!);
          favs.push({ songId: key.replace('fav:', ''), status: val.status, favoritedAt: val.favoritedAt });
        } catch { /* skip */ }
      }
      if (key.startsWith('owned:') && localStorage.getItem(key) === 'true') {
        owned++;
      }
    }
    setFavorites(favs);
    setOwnedCount(owned);
  };

  useEffect(() => {
    loadState();
    window.addEventListener('favorites-changed', loadState);
    window.addEventListener('owned-books-changed', loadState);
    return () => {
      window.removeEventListener('favorites-changed', loadState);
      window.removeEventListener('owned-books-changed', loadState);
    };
  }, []);

  useEffect(() => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      setRandomSongs(shuffled.slice(0, 7));
    }
  }, [songs]);

  const songMap = new Map(songs.map((s) => [s.id, s]));

  const activeSongs = favorites
    .filter((f) => f.status === 'learning' || f.status === 'want-to-learn')
    .sort((a, b) => b.favoritedAt - a.favoritedAt);

  const displayActive = activeSongs.slice(0, 4);

  const statusCounts: Record<string, number> = {};
  for (const f of favorites) {
    statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
  }

  return (
    <div class="space-y-8">
      {/* Stats */}
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <a href="/books?owned=1" class="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-emerald-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-emerald-700">
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{ownedCount}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">In Library</div>
        </a>
        <a href="/favorites" class="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-pink-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-pink-700">
          <div class="text-2xl font-bold text-pink-600 dark:text-pink-400">{favorites.length}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
        </a>
        <a href="/search" class="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-piano-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600">
          <div class="text-2xl font-bold text-piano-600 dark:text-piano-400">{songs.length}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Songs</div>
        </a>
        <a href="/books" class="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-piano-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600">
          <div class="text-2xl font-bold text-piano-600 dark:text-piano-400">{totalBooks}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Books</div>
        </a>
      </div>

      {/* Practice status breakdown */}
      {favorites.length > 0 && (
        <div>
          <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Practice Progress</h2>
          <div class="flex flex-wrap gap-2">
            {(['want-to-learn', 'learning', 'practiced', 'mastered'] as PracticeStatus[]).map((status) => (
              statusCounts[status] ? (
                <a
                  key={status}
                  href={`/favorites?status=${status}`}
                  class={`rounded-full px-3 py-1.5 text-sm font-medium ${statusColors[status]}`}
                >
                  {statusLabel[status]}: {statusCounts[status]}
                </a>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Quick resume */}
      {displayActive.length > 0 && (
        <div>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Continue Practicing</h2>
            {activeSongs.length > 4 && (
              <a href="/favorites?status=learning" class="text-sm text-piano-600 hover:text-piano-700 dark:text-piano-400 dark:hover:text-piano-300">
                View all ({activeSongs.length})
              </a>
            )}
          </div>
          <div class="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {displayActive.map((fav) => {
              const song = songMap.get(fav.songId);
              if (!song) return null;
              return (
                <a
                  key={fav.songId}
                  href={`/songs/${fav.songId}`}
                  class="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  <div class="shrink-0">
                    {song.bookCoverImage ? (
                      <img src={song.bookCoverImage} alt="" class="h-10 w-8 rounded object-cover shadow-sm" />
                    ) : (
                      <div class="flex h-10 w-8 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                        <svg class="h-4 w-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163zm0 0V4.5l-10.5 3v6.75m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 4.5 15V4.5" /></svg>
                      </div>
                    )}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{song.title}</div>
                    <div class="truncate text-xs text-gray-500 dark:text-gray-400">{song.composer} · {song.bookTitle}</div>
                  </div>
                  <span class={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[fav.status]}`}>
                    {statusLabel[fav.status]}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Random song suggestions */}
      {randomSongs.length > 0 && (
        <div>
          <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Try Something New</h2>
          <div class="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
            {randomSongs.map((song) => (
              <a
                key={song.id}
                href={`/songs/${song.id}`}
                class="flex w-44 shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors hover:border-piano-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600"
              >
                <div class="flex h-16 items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                  {song.bookCoverImage ? (
                    <img src={song.bookCoverImage} alt="" class="h-14 w-11 rounded object-cover shadow-sm" />
                  ) : (
                    <svg class="h-6 w-6 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163zm0 0V4.5l-10.5 3v6.75m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 4.5 15V4.5" /></svg>
                  )}
                </div>
                <div class="flex flex-1 flex-col p-3">
                  <div class="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">{song.title}</div>
                  <div class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{song.composer}</div>
                  <div class="mt-auto pt-1.5 truncate text-[11px] text-gray-400 dark:text-gray-500">{song.difficultyLabel}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div class="grid grid-cols-3 gap-3">
        <a
          href="/search"
          class="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-4 text-center transition-all hover:border-piano-300 hover:shadow-sm active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600"
        >
          <svg class="h-6 w-6 text-piano-600 dark:text-piano-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <div class="text-xs font-medium text-gray-900 dark:text-gray-100">Search Songs</div>
          <svg class="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
        </a>
        <a
          href="/books"
          class="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-4 text-center transition-all hover:border-piano-300 hover:shadow-sm active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600"
        >
          <svg class="h-6 w-6 text-piano-600 dark:text-piano-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
          <div class="text-xs font-medium text-gray-900 dark:text-gray-100">Browse Books</div>
          <svg class="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
        </a>
        <a
          href="/favorites"
          class="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-4 text-center transition-all hover:border-piano-300 hover:shadow-sm active:scale-[0.98] dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600"
        >
          <svg class="h-6 w-6 text-pink-500 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
          <div class="text-xs font-medium text-gray-900 dark:text-gray-100">Favorites</div>
          <svg class="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
        </a>
      </div>
    </div>
  );
}
