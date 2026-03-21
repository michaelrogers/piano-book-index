import { useEffect, useState } from 'preact/hooks';

type DifficultyLabel =
  | 'Beginner'
  | 'Early Intermediate'
  | 'Intermediate'
  | 'Late Intermediate'
  | 'Early Advanced'
  | 'Advanced';

const DIFFICULTY_LEVELS: DifficultyLabel[] = [
  'Beginner',
  'Early Intermediate',
  'Intermediate',
  'Late Intermediate',
  'Early Advanced',
  'Advanced',
];

const segmentFillColors: Record<DifficultyLabel, string> = {
  'Beginner': 'bg-green-500',
  'Early Intermediate': 'bg-yellow-500',
  'Intermediate': 'bg-orange-500',
  'Late Intermediate': 'bg-red-500',
  'Early Advanced': 'bg-purple-500',
  'Advanced': 'bg-pink-500',
};

const labelTextColors: Record<DifficultyLabel, string> = {
  'Beginner': 'text-green-700 dark:text-green-400',
  'Early Intermediate': 'text-yellow-700 dark:text-yellow-400',
  'Intermediate': 'text-orange-700 dark:text-orange-400',
  'Late Intermediate': 'text-red-700 dark:text-red-400',
  'Early Advanced': 'text-purple-700 dark:text-purple-400',
  'Advanced': 'text-pink-700 dark:text-pink-400',
};

function DifficultyScale({ label, faberLevel }: { label: DifficultyLabel; faberLevel: string | null }) {
  const levelIndex = DIFFICULTY_LEVELS.indexOf(label);
  const fillColor = segmentFillColors[label];

  return (
    <div class="flex items-center gap-2">
      <div class="flex flex-row gap-px" title={label}>
        {DIFFICULTY_LEVELS.map((_, i) => {
          return (
            <div
              key={i}
              class={`h-1.5 w-5 first:rounded-l-sm last:rounded-r-sm ${
                i <= levelIndex ? fillColor : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          );
        })}
      </div>
      <div class="min-w-0 text-xs leading-tight">
        <div class={`font-medium ${labelTextColors[label]}`}>{label}</div>
        {faberLevel && (
          <div class="text-gray-400 dark:text-gray-500">{faberLevel}</div>
        )}
      </div>
    </div>
  );
}

interface BookInfo {
  id: string;
  title: string;
  series: string;
  seriesLevel: string;
  bookType: 'lesson' | 'companion';
  coverImage: string;
  songCount: number;
  hasRealIndex: boolean;
  hasConfidentSource: boolean;
  hasVideos: boolean;
  difficultyLabel: DifficultyLabel | null;
  faberLevel: string | null;
  publisher: string;
}

interface Props {
  books: BookInfo[];
  seriesList: string[];
  publisherList: string[];
}

function syncToUrl(params: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  history.replaceState(null, '', url);
}

export default function BookFilter({ books, seriesList, publisherList }: Props) {
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [hideLessonBooks, setHideLessonBooks] = useState(true);
  const [ownedBookIds, setOwnedBookIds] = useState<Set<string>>(new Set());

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const diff = params.get('difficulty');
    if (diff && DIFFICULTY_LEVELS.includes(diff as DifficultyLabel)) {
      setSelectedDifficulty(diff);
    }
    const series = params.get('series');
    if (series && seriesList.includes(series)) {
      setSelectedSeries(series);
    }
    if (params.get('lesson') === '1') {
      setHideLessonBooks(false);
    }
    const pub = params.get('publisher');
    if (pub && publisherList.includes(pub)) {
      setSelectedPublisher(pub);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    syncToUrl({
      difficulty: selectedDifficulty,
      series: selectedSeries,
      publisher: selectedPublisher,
      lesson: hideLessonBooks ? '' : '1',
    });
  }, [selectedDifficulty, selectedSeries, selectedPublisher, hideLessonBooks, initialized]);

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

  const visibleBooks = hideLessonBooks
    ? books.filter((b) => b.bookType !== 'lesson')
    : books;

  const afterDifficulty = selectedDifficulty
    ? visibleBooks.filter((b) => b.difficultyLabel === selectedDifficulty)
    : visibleBooks;

  const afterPublisher = selectedPublisher
    ? afterDifficulty.filter((b) => b.publisher === selectedPublisher)
    : afterDifficulty;

  const filtered = selectedSeries
    ? afterPublisher.filter((b) => b.series === selectedSeries)
    : afterPublisher;

  // Sort: owned books first, then books with no songs to the bottom
  const sorted = [...filtered].sort((a, b) => {
    const aOwned = ownedBookIds.has(a.id) ? 0 : 1;
    const bOwned = ownedBookIds.has(b.id) ? 0 : 1;
    if (aOwned !== bOwned) return aOwned - bOwned;
    if (a.songCount === 0 && b.songCount > 0) return 1;
    if (a.songCount > 0 && b.songCount === 0) return -1;
    return 0;
  });

  return (
    <div>
      {/* Filter row */}
      <div class="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <label class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-gray-300 px-3 py-2 text-sm dark:border-gray-700">
          <input
            type="checkbox"
            checked={hideLessonBooks}
            onChange={(e) => setHideLessonBooks((e.target as HTMLInputElement).checked)}
            class="accent-piano-600"
          />
          <span class="text-gray-600 dark:text-gray-300">Hide lesson books</span>
        </label>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty((e.target as HTMLSelectElement).value)}
          class="shrink-0 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Levels</option>
          {DIFFICULTY_LEVELS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={selectedPublisher}
          onChange={(e) => setSelectedPublisher((e.target as HTMLSelectElement).value)}
          class="shrink-0 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All Publishers</option>
          {publisherList.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <button
          onClick={() => setSelectedSeries('')}
          class={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
            !selectedSeries
              ? 'bg-piano-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          All ({afterPublisher.length})
        </button>
        {seriesList.map((s) => {
          const count = afterPublisher.filter((b) => b.series === s).length;
          return (
            <button
              key={s}
              onClick={() => setSelectedSeries(s)}
              class={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                selectedSeries === s
                  ? 'bg-piano-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Book grid */}
      <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {sorted.map((book) => (
          <a
            key={book.id}
            href={`/books/${book.id}`}
            data-owned-card
            data-book-id={book.id}
            class={`group flex flex-col overflow-hidden rounded-lg border transition-all hover:shadow-md ${
              ownedBookIds.has(book.id)
                ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-900/10 dark:hover:border-emerald-700'
                : 'border-gray-200 bg-white hover:border-piano-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-piano-700'
            }`}
          >
            <div class="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={`Cover of ${book.title}`}
                  class="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div class="flex h-full items-center justify-center p-4 text-center">
                  <div>
                    <svg class="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163zm0 0V4.5l-10.5 3v6.75m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 4.5 15V4.5" /></svg>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{book.title}</p>
                  </div>
                </div>
              )}
              <div class="absolute right-2 top-2 flex flex-col items-end gap-1">
                <span class="rounded-full bg-piano-600 px-2 py-0.5 text-xs font-medium text-white">
                  {book.songCount} songs
                </span>
                {!book.hasConfidentSource && book.songCount > 0 && (
                  <span class="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                    Placeholder
                  </span>
                )}
                {book.songCount === 0 && (
                  <span class="rounded-full bg-gray-400 px-2 py-0.5 text-xs font-medium text-white">
                    No songs yet
                  </span>
                )}
                {book.hasVideos && (
                  <span class="rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-medium text-white" title="Has companion videos">
                    <svg class="inline h-3 w-3 align-text-bottom" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </span>
                )}
              </div>
              {ownedBookIds.has(book.id) && (
                <div class="absolute inset-x-0 bottom-0 bg-emerald-600/90 py-1 text-center text-xs font-semibold text-white dark:bg-emerald-700/90">
                  ✓ In Library
                </div>
              )}
            </div>
            <div class="flex flex-1 flex-col p-3">
              <h3 class="text-sm font-semibold leading-tight text-gray-900 group-hover:text-piano-700 dark:text-gray-100 dark:group-hover:text-piano-400">
                {book.title}
              </h3>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {book.series} &middot; {book.seriesLevel}
              </p>
              {book.difficultyLabel && (
                <div class="mt-1.5">
                  <DifficultyScale label={book.difficultyLabel} faberLevel={book.faberLevel} />
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
