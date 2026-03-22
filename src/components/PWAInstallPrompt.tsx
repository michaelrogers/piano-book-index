import { useState, useEffect } from 'preact/hooks';

const DISMISS_KEY = 'pwa-prompt-dismissed';
const VISIT_KEY = 'pwa-visit-count';
const DISMISS_DAYS = 7;
const MIN_VISITS = 2;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissed = new Date(raw).getTime();
  const now = Date.now();
  return now - dismissed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function getVisitCount(): number {
  return parseInt(localStorage.getItem(VISIT_KEY) || '0', 10);
}

function incrementVisitCount(): number {
  const count = getVisitCount() + 1;
  localStorage.setItem(VISIT_KEY, String(count));
  return count;
}

export default function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!isIOS() || isStandalone()) return;

    const visits = incrementVisitCount();
    if (visits < MIN_VISITS || isDismissed()) return;

    // Show after a short delay for a less jarring entrance
    const timer = setTimeout(() => {
      setVisible(true);
      // Trigger CSS animation on next frame
      requestAnimationFrame(() => setAnimateIn(true));
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setAnimateIn(false);
    // Wait for exit animation before unmounting
    setTimeout(() => {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
      setVisible(false);
    }, 200);
  };

  if (!visible) return null;

  return (
    <div
      class={`fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 safe-bottom transition-all duration-300 ease-out ${
        animateIn ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div class="mx-auto max-w-lg overflow-hidden rounded-2xl border border-piano-200 bg-white shadow-lg dark:border-piano-800 dark:bg-gray-900">
        <div class="flex items-start gap-3 px-4 py-3">
          {/* Share icon */}
          <div class="mt-0.5 shrink-0 rounded-lg bg-piano-100 p-2 dark:bg-piano-900/40">
            <svg class="h-5 w-5 text-piano-600 dark:text-piano-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
            </svg>
          </div>

          {/* Text */}
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Install Piano Book Index
            </p>
            <p class="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Tap{' '}
              <svg class="inline h-3.5 w-3.5 align-text-bottom text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
              </svg>
              {' '}Share, then "Add to Home Screen" for a full-screen app experience.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={dismiss}
            class="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Dismiss install prompt"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
