import { useState, useEffect } from 'preact/hooks';

interface Props {
  currentPath: string;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

const tabs = [
  {
    href: '/',
    label: 'Home',
    matchExact: true,
    icon: (active: boolean) => (
      <svg class="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
    ),
  },
  {
    href: '/search',
    label: 'Search',
    matchExact: true,
    icon: () => (
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    ),
  },
  {
    href: '/books',
    label: 'Books',
    matchExact: false,
    icon: () => (
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    ),
  },
  {
    href: '/favorites',
    label: 'Favorites',
    matchExact: true,
    icon: (active: boolean) => (
      <svg class="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
    ),
  },
];

export default function PWABottomNav({ currentPath }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isStandalone());
  }, []);

  if (!show) return null;

  const isActive = (tab: typeof tabs[0]) =>
    tab.matchExact ? currentPath === tab.href : currentPath.startsWith(tab.href);

  return (
    <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur sm:hidden dark:border-gray-800 dark:bg-gray-950/95">
      <div class="mx-auto grid max-w-lg grid-cols-4 pb-[env(safe-area-inset-bottom,0px)]">
        {tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <a
              key={tab.href}
              href={tab.href}
              class={`flex flex-col items-center gap-0.5 pt-2 pb-1 text-[11px] transition-colors ${
                active
                  ? 'text-piano-600 dark:text-piano-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.icon(active)}
              {tab.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
