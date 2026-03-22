import { useState, useEffect, useRef } from 'preact/hooks';
import ThemeToggle from './ThemeToggle';

interface Props {
  currentPath: string;
}

const navItems = [
  { href: '/', label: 'Home', matchExact: true },
  { href: '/search', label: 'Search', matchExact: true },
  { href: '/books', label: 'Books', matchExact: false },
  { href: '/favorites', label: 'Favorites', matchExact: true },
  { href: '/difficulty', label: 'Difficulty Reference', matchExact: true },
];

export default function MobileDrawer({ currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (item: typeof navItems[0]) =>
    item.matchExact ? currentPath === item.href : currentPath.startsWith(item.href);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        class="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="Open menu"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay + drawer */}
      {open && (
        <div class="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            class="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div
            ref={panelRef}
            class="absolute right-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-xl dark:bg-gray-950 animate-slide-in-right"
          >
            {/* Header */}
            <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Menu</span>
              <button
                onClick={() => setOpen(false)}
                class="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Close menu"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav class="flex-1 overflow-y-auto px-3 py-3">
              <ul class="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        class={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                          active
                            ? 'bg-piano-100 text-piano-700 dark:bg-piano-900/30 dark:text-piano-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer with theme toggle */}
            <div class="border-t border-gray-200 px-5 py-4 safe-bottom dark:border-gray-800">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500 dark:text-gray-400">Appearance</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
