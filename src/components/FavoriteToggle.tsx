import { useState, useEffect } from 'preact/hooks';

export type PracticeStatus = 'want-to-learn' | 'learning' | 'practiced' | 'mastered';

interface FavoriteData {
  status: PracticeStatus;
  favoritedAt: number;
}

const STATUS_OPTIONS: { value: PracticeStatus; label: string; emoji: string }[] = [
  { value: 'want-to-learn', label: 'Want to Learn', emoji: '📋' },
  { value: 'learning', label: 'Learning', emoji: '📖' },
  { value: 'practiced', label: 'Practiced', emoji: '✅' },
  { value: 'mastered', label: 'Mastered', emoji: '⭐' },
];

interface Props {
  songId: string;
  showStatus?: boolean;
}

function getFavorite(songId: string): FavoriteData | null {
  try {
    const raw = localStorage.getItem(`fav:${songId}`);
    if (!raw) return null;
    return JSON.parse(raw) as FavoriteData;
  } catch {
    return null;
  }
}

function setFavorite(songId: string, status: PracticeStatus) {
  const data: FavoriteData = { status, favoritedAt: Date.now() };
  localStorage.setItem(`fav:${songId}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('favorites-changed', { detail: { songId, status, removed: false } }));
}

function removeFavorite(songId: string) {
  localStorage.removeItem(`fav:${songId}`);
  window.dispatchEvent(new CustomEvent('favorites-changed', { detail: { songId, status: null, removed: true } }));
}

export default function FavoriteToggle({ songId, showStatus = false }: Props) {
  const [fav, setFav] = useState<FavoriteData | null>(null);

  useEffect(() => {
    setFav(getFavorite(songId));
  }, [songId]);

  const toggleFavorite = () => {
    if (fav) {
      removeFavorite(songId);
      setFav(null);
    } else {
      setFavorite(songId, 'want-to-learn');
      setFav({ status: 'want-to-learn', favoritedAt: Date.now() });
    }
  };

  const changeStatus = (status: PracticeStatus) => {
    setFavorite(songId, status);
    setFav({ status, favoritedAt: fav?.favoritedAt ?? Date.now() });
  };

  return (
    <div class="flex flex-wrap items-center gap-2">
      <button
        onClick={toggleFavorite}
        class={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
          fav
            ? 'border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100 dark:border-pink-700 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/40'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
        aria-pressed={!!fav}
      >
        <span>{fav ? '♥' : '♡'}</span>
        <span>{fav ? 'Favorited' : 'Favorite'}</span>
      </button>

      {fav && showStatus && (
        <div class="flex flex-wrap gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => changeStatus(opt.value)}
              class={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                fav.status === opt.value
                  ? 'border-piano-300 bg-piano-50 text-piano-700 dark:border-piano-700 dark:bg-piano-900/30 dark:text-piano-400'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700'
              }`}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
