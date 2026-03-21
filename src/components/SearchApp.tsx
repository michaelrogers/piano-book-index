import { useEffect, useMemo, useState } from 'preact/hooks';
import Fuse from 'fuse.js';
import type { SongSearchItem, DifficultyLabel } from '../lib/types';

interface Props {
  songs: SongSearchItem[];
  genres: string[];
  series: string[];
  publishers: string[];
}

const difficultyColors: Record<DifficultyLabel, string> = {
  'Beginner': 'text-green-700 dark:text-green-400',
  'Early Intermediate': 'text-yellow-700 dark:text-yellow-400',
  'Intermediate': 'text-orange-700 dark:text-orange-400',
  'Late Intermediate': 'text-red-700 dark:text-red-400',
  'Early Advanced': 'text-purple-700 dark:text-purple-400',
  'Advanced': 'text-pink-700 dark:text-pink-400',
};

const DIFFICULTY_LABELS: DifficultyLabel[] = [
  'Beginner',
  'Early Intermediate',
  'Intermediate',
  'Late Intermediate',
  'Early Advanced',
  'Advanced',
];

function syncToUrl(params: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  history.replaceState(null, '', url);
}

export default function SearchApp({ songs, genres, series, publishers }: Props) {
  const [query, setQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [hideLessonBooks, setHideLessonBooks] = useState(true);
  const [ownedBookIds, setOwnedBookIds] = useState<Set<string>>(new Set());
  const [favSongIds, setFavSongIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setQuery(params.get('q')!);
    if (params.get('difficulty') && DIFFICULTY_LABELS.includes(params.get('difficulty') as DifficultyLabel)) setSelectedDifficulty(params.get('difficulty')!);
    if (params.get('genre')) setSelectedGenre(params.get('genre')!);
    if (params.get('series')) setSelectedSeries(params.get('series')!);
    if (params.get('publisher')) setSelectedPublisher(params.get('publisher')!);
    if (params.get('owned') === '1') setOnlyOwned(true);
    if (params.get('lesson') === '1') setHideLessonBooks(false);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    syncToUrl({
      q: query,
      difficulty: selectedDifficulty,
      genre: selectedGenre,
      series: selectedSeries,
      publisher: selectedPublisher,
      owned: onlyOwned ? '1' : '',
      lesson: hideLessonBooks ? '' : '1',
    });
  }, [query, selectedDifficulty, selectedGenre, selectedSeries, selectedPublisher, onlyOwned, hideLessonBooks, initialized]);

  useEffect(() => {
    const loadOwnedBooks = () => {
      const ownedIds = new Set<string>();
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('owned:')) {
          continue;
        }
        if (localStorage.getItem(key) === 'true') {
          ownedIds.add(key.replace('owned:', ''));
        }
      }
      setOwnedBookIds(ownedIds);
    };

    loadOwnedBooks();
    window.addEventListener('storage', loadOwnedBooks);
    window.addEventListener('owned-books-changed', loadOwnedBooks as EventListener);
    return () => {
      window.removeEventListener('storage', loadOwnedBooks);
      window.removeEventListener('owned-books-changed', loadOwnedBooks as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadFavorites = () => {
      const ids = new Set<string>();
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('fav:')) continue;
        ids.add(key.replace('fav:', ''));
      }
      setFavSongIds(ids);
    };

    loadFavorites();
    window.addEventListener('storage', loadFavorites);
    window.addEventListener('favorites-changed', loadFavorites as EventListener);
    return () => {
      window.removeEventListener('storage', loadFavorites);
      window.removeEventListener('favorites-changed', loadFavorites as EventListener);
    };
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(songs, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'composer', weight: 1.5 },
          { name: 'genre', weight: 1 },
          { name: 'bookTitle', weight: 0.5 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [songs],
  );

  const results = useMemo(() => {
    let filtered = query.trim()
      ? fuse.search(query).map((r) => r.item)
      : songs;

    if (selectedDifficulty) {
      filtered = filtered.filter((s) => s.difficultyLabel === selectedDifficulty);
    }
    if (selectedGenre) {
      filtered = filtered.filter((s) => s.genre === selectedGenre);
    }
    if (selectedSeries) {
      filtered = filtered.filter((s) => s.bookSeries === selectedSeries);
    }
    if (selectedPublisher) {
      filtered = filtered.filter((s) => s.bookPublisher === selectedPublisher);
    }
    if (hideLessonBooks) {
      filtered = filtered.filter((s) => s.bookType !== 'lesson');
    }
    if (onlyOwned) {
      filtered = filtered.filter((s) => ownedBookIds.has(s.bookId));
    }
    return filtered;
  }, [query, selectedDifficulty, selectedGenre, selectedSeries, selectedPublisher, onlyOwned, hideLessonBooks, ownedBookIds, fuse, songs]);

  return (
    <div>
      {/* Search input */}
      <div class="relative">
        <input
          type="text"
          placeholder="Search songs by title, composer, or genre..."
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 text-base shadow-sm transition-colors focus:border-piano-500 focus:outline-none focus:ring-2 focus:ring-piano-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-piano-400"
        />
        <svg class="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Filters */}
      <div class="mt-3 flex flex-nowrap gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty((e.target as HTMLSelectElement).value)}
          class="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Levels</option>
          {DIFFICULTY_LABELS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre((e.target as HTMLSelectElement).value)}
          class="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={selectedSeries}
          onChange={(e) => setSelectedSeries((e.target as HTMLSelectElement).value)}
          class="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Series</option>
          {series.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={selectedPublisher}
          onChange={(e) => setSelectedPublisher((e.target as HTMLSelectElement).value)}
          class="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Publishers</option>
          {publishers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <label class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700">
          <input
            type="checkbox"
            checked={onlyOwned}
            onChange={(e) => setOnlyOwned((e.target as HTMLInputElement).checked)}
            class="accent-piano-600"
          />
          <span class="text-gray-600 dark:text-gray-300">In Library only</span>
        </label>

        <label class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700">
          <input
            type="checkbox"
            checked={hideLessonBooks}
            onChange={(e) => setHideLessonBooks((e.target as HTMLInputElement).checked)}
            class="accent-piano-600"
          />
          <span class="text-gray-600 dark:text-gray-300">Hide lesson books</span>
        </label>

        {(selectedDifficulty || selectedGenre || selectedSeries || selectedPublisher) && (
          <button
            onClick={() => {
              setSelectedDifficulty('');
              setSelectedGenre('');
              setSelectedSeries('');
              setSelectedPublisher('');
            }}
            class="shrink-0 rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {results.length} {results.length === 1 ? 'song' : 'songs'} found
      </p>

      {/* Results list */}
      <div class="mt-3 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
        {results.map((song) => (
          <a
            key={song.id}
            href={`/songs/${song.id}`}
            class={`group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
              ownedBookIds.has(song.bookId)
                ? 'bg-emerald-50/40 dark:bg-emerald-900/10'
                : ''
            }`}
          >
            <div class="shrink-0">
              {song.bookCoverImage ? (
                <img src={song.bookCoverImage} alt="" class="h-10 w-8 rounded object-cover shadow-sm" />
              ) : (
                <div class="flex h-10 w-8 items-center justify-center rounded bg-gray-100 dark:bg-gray-800"><svg class="h-4 w-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163zm0 0V4.5l-10.5 3v6.75m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 4.5 15V4.5" /></svg></div>
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
                {ownedBookIds.has(song.bookId) && (
                  <span class="shrink-0 text-xs text-emerald-600 dark:text-emerald-400">✓</span>
                )}
                {favSongIds.has(song.id) && (
                  <span class="shrink-0 text-xs text-pink-500 dark:text-pink-400">♥</span>
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
        ))}
      </div>

      {results.length === 0 && (
        <div class="mt-8 text-center text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163zm0 0V4.5l-10.5 3v6.75m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 4.5 15V4.5" /></svg>
          <p class="mt-2">No songs found. Try a different search or adjust filters.</p>
        </div>
      )}
    </div>
  );
}
