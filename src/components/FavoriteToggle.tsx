import { useState, useEffect } from 'preact/hooks';

export type PracticeStatus = 'want-to-learn' | 'learning' | 'practiced' | 'mastered';

export interface FavoriteData {
  status: PracticeStatus;
  favoritedAt: number;
}

export const STATUS_OPTIONS: { value: PracticeStatus; label: string }[] = [
  { value: 'want-to-learn', label: 'Want to Learn' },
  { value: 'learning', label: 'Learning' },
  { value: 'practiced', label: 'Practiced' },
  { value: 'mastered', label: 'Mastered' },
];

interface Props {
  songId: string;
}

export function getFavorite(songId: string): FavoriteData | null {
  try {
    const raw = localStorage.getItem(`fav:${songId}`);
    if (!raw) return null;
    return JSON.parse(raw) as FavoriteData;
  } catch {
    return null;
  }
}

export function setFavorite(songId: string, status: PracticeStatus) {
  const data: FavoriteData = { status, favoritedAt: Date.now() };
  localStorage.setItem(`fav:${songId}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('favorites-changed', { detail: { songId, status, removed: false } }));
}

export function removeFavoriteFromStorage(songId: string) {
  localStorage.removeItem(`fav:${songId}`);
  window.dispatchEvent(new CustomEvent('favorites-changed', { detail: { songId, status: null, removed: true } }));
}

export default function FavoriteToggle({ songId }: Props) {
  const [fav, setFav] = useState<FavoriteData | null>(null);

  useEffect(() => {
    setFav(getFavorite(songId));
  }, [songId]);

  const toggleFavorite = () => {
    if (fav) {
      removeFavoriteFromStorage(songId);
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
    <div class="flex items-center gap-2">
      <button
        onClick={toggleFavorite}
        class={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          fav
            ? 'border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100 dark:border-pink-700 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/40'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
        aria-pressed={!!fav}
      >
        <span>{fav ? '♥' : '♡'}</span>
        <span>{fav ? 'Favorited' : 'Favorite'}</span>
      </button>

      {fav && (
        <select
          value={fav.status}
          onChange={(e) => changeStatus((e.target as HTMLSelectElement).value as PracticeStatus)}
          class="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
