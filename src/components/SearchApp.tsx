import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import Fuse from 'fuse.js';
import type { SongSearchItem, DifficultyLabel } from '../lib/types';
import DifficultyRangeFilter, { DIFFICULTY_LABELS } from './DifficultyRangeFilter';

interface Props {
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

function syncToUrl(params: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  history.replaceState(null, '', url);
}

export default function SearchApp({ genres, series, publishers }: Props) {
  const [songs, setSongs] = useState<SongSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [diffMin, setDiffMin] = useState<number | null>(null);
  const [diffMax, setDiffMax] = useState<number | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const genreRef = useRef<HTMLDivElement>(null);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [hideLessonBooks, setHideLessonBooks] = useState(true);
  const [ownedBookIds, setOwnedBookIds] = useState<Set<string>>(new Set());
  const [favSongIds, setFavSongIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [randomSongs, setRandomSongs] = useState<SongSearchItem[]>([]);

  // Fetch song data from static JSON endpoint
  useEffect(() => {
    fetch('/api/search-index.json')
      .then((r) => r.json())
      .then((data: SongSearchItem[]) => {
        setSongs(data);
        setLoading(false);
      });
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(50);
  }, [debouncedQuery, diffMin, diffMax, selectedGenres, selectedSeries, selectedPublisher, onlyOwned, hideLessonBooks]);

  // Close genre dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setQuery(params.get('q')!);
    const dmin = params.get('dmin');
    const dmax = params.get('dmax');
    if (dmin !== null && dmax !== null) {
      const mn = parseInt(dmin, 10);
      const mx = parseInt(dmax, 10);
      if (!isNaN(mn) && !isNaN(mx) && mn >= 0 && mx < DIFFICULTY_LABELS.length) {
        setDiffMin(mn);
        setDiffMax(mx);
      }
    }
    const genreParam = params.get('genres');
    if (genreParam) setSelectedGenres(new Set(genreParam.split(',')));
    if (params.get('series')) setSelectedSeries(params.get('series')!);
    if (params.get('publisher')) setSelectedPublisher(params.get('publisher')!);
    if (params.get('owned') === '1') setOnlyOwned(true);
    if (params.get('lesson') === '1') setHideLessonBooks(false);
    // Auto-expand filters if any are set from URL
    if (dmin !== null || genreParam || params.get('series') || params.get('publisher') || params.get('owned') === '1') {
      setFiltersOpen(true);
    }
    // Pick 6 random suggestions for empty state
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      setRandomSongs(shuffled.slice(0, 6));
    }
    setInitialized(true);
  }, [loading]);

  useEffect(() => {
    if (!initialized) return;
    syncToUrl({
      q: query,
      dmin: diffMin !== null ? String(diffMin) : '',
      dmax: diffMax !== null ? String(diffMax) : '',
      genres: selectedGenres.size > 0 ? [...selectedGenres].join(',') : '',
      series: selectedSeries,
      publisher: selectedPublisher,
      owned: onlyOwned ? '1' : '',
      lesson: hideLessonBooks ? '' : '1',
    });
  }, [query, diffMin, diffMax, selectedGenres, selectedSeries, selectedPublisher, onlyOwned, hideLessonBooks, initialized]);

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
        includeScore: true,
      }),
    [songs],
  );

  const hasActiveFilter = debouncedQuery.trim() || diffMin !== null || selectedGenres.size > 0 || selectedSeries || selectedPublisher || onlyOwned;

  const fuseResults = useMemo(
    () => (debouncedQuery.trim() ? fuse.search(debouncedQuery) : null),
    [debouncedQuery, fuse],
  );

  const searchScores = useMemo(() => {
    if (!fuseResults) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const r of fuseResults) map.set(r.item.id, r.score ?? 1);
    return map;
  }, [fuseResults]);

  const results = useMemo(() => {
    let filtered = fuseResults
      ? fuseResults.map((r) => r.item)
      : songs;

    if (diffMin !== null && diffMax !== null) {
      filtered = filtered.filter((s) => {
        const idx = DIFFICULTY_LABELS.indexOf(s.difficultyLabel);
        return idx >= diffMin && idx <= diffMax;
      });
    }
    if (selectedGenres.size > 0) {
      filtered = filtered.filter((s) =>
        s.genreTags.some((t) => selectedGenres.has(t)),
      );
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
  }, [debouncedQuery, diffMin, diffMax, selectedGenres, selectedSeries, selectedPublisher, onlyOwned, hideLessonBooks, ownedBookIds, fuse, songs]);

  return (
    <div>
      {loading && (
        <div class="flex items-center justify-center py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-piano-600 dark:border-gray-700 dark:border-t-piano-400" />
        </div>
      )}

      {!loading && (
      <>
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

      {/* Collapsible filters */}
      {(() => {
        const activeFilterCount = (diffMin !== null ? 1 : 0) + (selectedGenres.size > 0 ? 1 : 0) + (selectedSeries ? 1 : 0) + (selectedPublisher ? 1 : 0) + (onlyOwned ? 1 : 0);
        return (
          <div class="mt-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              class="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              <svg class={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              Filters
              {activeFilterCount > 0 && (
                <span class="rounded-full bg-piano-100 px-1.5 py-0.5 text-xs font-medium text-piano-700 dark:bg-piano-900/40 dark:text-piano-300">{activeFilterCount}</span>
              )}
            </button>

            {filtersOpen && (
              <div class="mt-2 space-y-3">
                {/* Difficulty range */}
                <DifficultyRangeFilter min={diffMin} max={diffMax} onChange={(mn, mx) => { setDiffMin(mn); setDiffMax(mx); }} />

                {/* Filters */}
                <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <div ref={genreRef} class="relative">
          <button
            type="button"
            onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
            class={`w-full rounded-lg border px-3 py-2 text-sm ${
              selectedGenres.size > 0
                ? 'border-piano-400 bg-piano-50 text-piano-700 dark:border-piano-600 dark:bg-piano-900/30 dark:text-piano-300'
                : 'border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
            }`}
          >
            {selectedGenres.size > 0 ? `Genres (${selectedGenres.size})` : 'All Genres'}
            <svg class="ml-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {genreDropdownOpen && (
            <div class="absolute left-0 z-20 mt-1 max-h-60 w-52 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {genres.map((g) => (
                <label key={g} class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={selectedGenres.has(g)}
                    onChange={() => {
                      const next = new Set(selectedGenres);
                      if (next.has(g)) next.delete(g);
                      else next.add(g);
                      setSelectedGenres(next);
                    }}
                    class="accent-piano-600"
                  />
                  <span class="text-gray-700 dark:text-gray-300">{g}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <select
          value={selectedSeries}
          onChange={(e) => setSelectedSeries((e.target as HTMLSelectElement).value)}
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Series</option>
          {series.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={selectedPublisher}
          onChange={(e) => setSelectedPublisher((e.target as HTMLSelectElement).value)}
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Publishers</option>
          {publishers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700">
          <input
            type="checkbox"
            checked={onlyOwned}
            onChange={(e) => setOnlyOwned((e.target as HTMLInputElement).checked)}
            class="accent-piano-600"
          />
          <span class="text-gray-600 dark:text-gray-300">In Library</span>
        </label>

        <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700">
          <input
            type="checkbox"
            checked={hideLessonBooks}
            onChange={(e) => setHideLessonBooks((e.target as HTMLInputElement).checked)}
            class="accent-piano-600"
          />
          <span class="text-gray-600 dark:text-gray-300">Hide lessons</span>
        </label>

        {(diffMin !== null || selectedGenres.size > 0 || selectedSeries || selectedPublisher) && (
          <button
            onClick={() => {
              setDiffMin(null);
              setDiffMax(null);
              setSelectedGenres(new Set());
              setSelectedSeries('');
              setSelectedPublisher('');
            }}
            class="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear filters
          </button>
        )}
              </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Genre pills (always visible if active) */}
      {selectedGenres.size > 0 && (
        <div class="mt-2 flex flex-wrap gap-1.5">
          {[...selectedGenres].map((g) => (
            <button
              key={g}
              onClick={() => {
                const next = new Set(selectedGenres);
                next.delete(g);
                setSelectedGenres(next);
              }}
              class="inline-flex items-center gap-1 rounded-full bg-piano-100 px-2.5 py-1 text-xs font-medium text-piano-700 hover:bg-piano-200 dark:bg-piano-900/40 dark:text-piano-300 dark:hover:bg-piano-800/60"
            >
              {g}
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {hasActiveFilter
          ? `${results.length} ${results.length === 1 ? 'song' : 'songs'} found`
          : `${songs.length} songs — type to search or apply filters`}
      </p>

      {/* Song suggestions when idle */}
      {!hasActiveFilter && randomSongs.length > 0 && (
        <div class="mt-6">
          <h2 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Try Something New</h2>
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

      {/* Results list */}
      {hasActiveFilter && (
      <div class="mt-3 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
        {results.slice(0, displayLimit).map((song) => {
          const score = searchScores.get(song.id);
          const isWeakMatch = score !== undefined && score > 0.15;
          return (
          <a
            key={song.id}
            href={`/songs/${song.id}`}
            class={`group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
              ownedBookIds.has(song.bookId)
                ? 'bg-emerald-50/40 dark:bg-emerald-900/10'
                : ''
            } ${isWeakMatch ? 'opacity-50' : ''}`}
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
          );
        })}
        {results.length > displayLimit && (
          <button
            type="button"
            onClick={() => setDisplayLimit((l) => l + 50)}
            class="w-full px-3 py-3 text-center text-sm font-medium text-piano-600 hover:bg-gray-50 dark:text-piano-400 dark:hover:bg-gray-800"
          >
            Show more ({results.length - displayLimit} remaining)
          </button>
        )}
      </div>
      )}

      {hasActiveFilter && results.length === 0 && (
        <div class="mt-8 text-center text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163zm0 0V4.5l-10.5 3v6.75m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 4.5 15V4.5" /></svg>
          <p class="mt-2">No songs found. Try a different search or adjust filters.</p>
        </div>
      )}
      </>
      )}
    </div>
  );
}
