import { useState, useEffect } from 'preact/hooks';

interface Props {
  bookId: string;
  label?: string;
}

export default function OwnedToggle({ bookId, label = 'Add to Library' }: Props) {
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`owned:${bookId}`);
    if (stored === 'true') setOwned(true);
  }, [bookId]);

  const toggle = () => {
    const next = !owned;
    setOwned(next);
    localStorage.setItem(`owned:${bookId}`, String(next));
    window.dispatchEvent(new CustomEvent('owned-books-changed', { detail: { bookId, owned: next } }));
  };

  return (
    <button
      onClick={toggle}
      class={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        owned
          ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
      }`}
      aria-pressed={owned}
    >
      <span>{owned ? '✓' : '○'}</span>
      <span>{owned ? 'In Library' : label}</span>
    </button>
  );
}
