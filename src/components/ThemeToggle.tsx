import { useState, useEffect } from 'preact/hooks';

type Theme = 'light' | 'dark' | 'system';

const icons: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  system: '💻',
};

function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setTheme(stored);
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const current = localStorage.getItem('theme') as Theme | null;
      if (!current || current === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const cycle = () => {
    const order: Theme[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  return (
    <button
      onClick={cycle}
      title={`Theme: ${theme}`}
      class="rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {icons[theme]}
    </button>
  );
}
