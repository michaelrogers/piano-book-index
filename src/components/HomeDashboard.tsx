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
  songs: SongSummary[];
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

export default function HomeDashboard({ songs, totalBooks }: Props) {
  const [favorites, setFavorites] = useState<FavEntry[]>([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [randomSong, setRandomSong] = useState<SongSummary | null>(null);

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
    // Pick a random song
    if (songs.length > 0) {
      setRandomSong(songs[Math.floor(Math.random() * songs.length)]);
    }
    window.addEventListener('favorites-changed', loadState);
    window.addEventListener('owned-books-changed', loadState);
    return () => {
      window.removeEventListener('favorites-changed', loadState);
      window.removeEventListener('owned-books-changed', loadState);
    };
  }, []);

  const songMap = new Map(songs.map((s) => [s.id, s]));

  const activeSongs = favorites
    .filter((f) => f.status === 'learning' || f.status === 'want-to-learn')
    .sort((a, b) => b.favoritedAt - a.favoritedAt)
    .slice(0, 6);

  const statusCounts: Record<string, number> = {};
  for (const f of favorites) {
    statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
  }

  return (
    <div class="space-y-8">
      {/* Quick search */}
      <a
        href="/search"
        class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-piano-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600 dark:hover:bg-gray-800"
      >
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="text-gray-500 dark:text-gray-400">Search songs by title, composer, or genre...</span>
      </a>

      {/* Stats */}
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="text-2xl font-bold text-piano-600 dark:text-piano-400">{songs.length}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Songs</div>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="text-2xl font-bold text-piano-600 dark:text-piano-400">{totalBooks}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Books</div>
        </div>
        <a href="/books?owned=1" class="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-emerald-700">
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{ownedCount}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">In Library</div>
        </a>
        <a href="/favorites" class="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-pink-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-pink-700">
          <div class="text-2xl font-bold text-pink-600 dark:text-pink-400">{favorites.length}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
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
      {activeSongs.length > 0 && (
        <div>
          <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Continue Practicing</h2>
          <div class="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {activeSongs.map((fav) => {
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

      {/* Random song suggestion */}
      {randomSong && (
        <div>
          <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Try Something New</h2>
          <a
            href={`/songs/${randomSong.id}`}
            class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-piano-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600 dark:hover:bg-gray-800"
          >
            <div class="shrink-0">
              {randomSong.bookCoverImage ? (
                <img src={randomSong.bookCoverImage} alt="" class="h-14 w-11 rounded object-cover shadow-sm" />
              ) : (
                <div class="flex h-14 w-11 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                  <svg class="h-5 w-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163zm0 0V4.5l-10.5 3v6.75m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 4.5 15V4.5" /></svg>
                </div>
              )}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-base font-medium text-gray-900 dark:text-gray-100">{randomSong.title}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{randomSong.composer}</div>
              <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">{randomSong.bookTitle} · {randomSong.difficultyLabel}</div>
            </div>
            <svg class="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}

      {/* Quick links */}
      <div class="grid grid-cols-2 gap-3">
        <a
          href="/books"
          class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-piano-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600"
        >
          <svg class="h-6 w-6 text-piano-600 dark:text-piano-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">Browse Books</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{totalBooks} books</div>
          </div>
        </a>
        <a
          href="/favorites"
          class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-piano-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-piano-600"
        >
          <svg class="h-6 w-6 text-pink-500 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">Favorites</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{favorites.length} songs</div>
          </div>
        </a>
      </div>
    </div>
  );
}
