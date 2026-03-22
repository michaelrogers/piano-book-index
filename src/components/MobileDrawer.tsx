import { useState, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
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

// Items that only show in PWA mode (not covered by bottom tab bar)
const pwaNavItems = [
  { href: '/difficulty', label: 'Difficulty Reference', matchExact: true },
];

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

async function handleHardRefresh() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  window.location.reload();
}

export default function MobileDrawer({ currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
  }, []);

  // Hook into the static hamburger button rendered in BaseLayout
  useEffect(() => {
    const btn = document.getElementById('mobile-menu-btn');
    if (!btn) return;
    const handler = () => setOpen(true);
    btn.addEventListener('click', handler);
    return () => btn.removeEventListener('click', handler);
  }, []);

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

  const visibleNav = standalone ? pwaNavItems : navItems;

  const isActive = (item: typeof navItems[0]) =>
    item.matchExact ? currentPath === item.href : currentPath.startsWith(item.href);

  if (!open) return null;

  // Drawer portaled to body to escape header stacking context
  return createPortal(
    <div class="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Panel */}
      <div
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
            {visibleNav.map((item) => {
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

          {/* Hard refresh */}
          <div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
            <button
              onClick={async () => {
                setRefreshing(true);
                await handleHardRefresh();
              }}
              disabled={refreshing}
              class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg class={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.016 4.356v4.992" />
              </svg>
              {refreshing ? 'Clearing cache…' : 'Hard Refresh'}
            </button>
          </div>
        </nav>

        {/* Footer with theme toggle */}
        <div class="border-t border-gray-200 px-5 py-4 safe-bottom dark:border-gray-800">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
