import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import FavoriteToggle, {
  getFavorite,
  setFavorite,
  removeFavoriteFromStorage,
  STATUS_OPTIONS,
} from '../components/FavoriteToggle';
import type { PracticeStatus, FavoriteData } from '../components/FavoriteToggle';

describe('FavoriteToggle helper functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getFavorite', () => {
    it('returns null when no favorite exists', () => {
      expect(getFavorite('song-1')).toBeNull();
    });

    it('returns the stored favorite data', () => {
      const data: FavoriteData = { status: 'learning', favoritedAt: 1000 };
      localStorage.setItem('fav:song-1', JSON.stringify(data));
      const result = getFavorite('song-1');
      expect(result).toEqual(data);
    });

    it('returns null for invalid JSON in localStorage', () => {
      localStorage.setItem('fav:song-1', 'not-valid-json');
      expect(getFavorite('song-1')).toBeNull();
    });

    it('uses the correct localStorage key format', () => {
      const data: FavoriteData = { status: 'mastered', favoritedAt: 2000 };
      localStorage.setItem('fav:my-song', JSON.stringify(data));
      expect(getFavorite('my-song')).toEqual(data);
      expect(getFavorite('other-song')).toBeNull();
    });
  });

  describe('setFavorite', () => {
    it('stores favorite data in localStorage', () => {
      setFavorite('song-1', 'learning');
      const stored = JSON.parse(localStorage.getItem('fav:song-1')!);
      expect(stored.status).toBe('learning');
      expect(typeof stored.favoritedAt).toBe('number');
    });

    it('dispatches favorites-changed custom event', () => {
      const handler = vi.fn();
      window.addEventListener('favorites-changed', handler);
      setFavorite('song-1', 'practiced');
      expect(handler).toHaveBeenCalledOnce();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.songId).toBe('song-1');
      expect(detail.status).toBe('practiced');
      expect(detail.removed).toBe(false);
      window.removeEventListener('favorites-changed', handler);
    });

    it('overwrites existing favorite', () => {
      setFavorite('song-1', 'learning');
      setFavorite('song-1', 'mastered');
      const result = getFavorite('song-1');
      expect(result!.status).toBe('mastered');
    });
  });

  describe('removeFavoriteFromStorage', () => {
    it('removes the favorite from localStorage', () => {
      setFavorite('song-1', 'learning');
      expect(getFavorite('song-1')).not.toBeNull();
      removeFavoriteFromStorage('song-1');
      expect(getFavorite('song-1')).toBeNull();
    });

    it('dispatches favorites-changed event with removed: true', () => {
      const handler = vi.fn();
      window.addEventListener('favorites-changed', handler);
      removeFavoriteFromStorage('song-1');
      expect(handler).toHaveBeenCalledOnce();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.songId).toBe('song-1');
      expect(detail.removed).toBe(true);
      expect(detail.status).toBeNull();
      window.removeEventListener('favorites-changed', handler);
    });

    it('is safe to call for a non-existent favorite', () => {
      expect(() => removeFavoriteFromStorage('non-existent')).not.toThrow();
    });
  });

  describe('STATUS_OPTIONS', () => {
    it('contains 4 practice statuses', () => {
      expect(STATUS_OPTIONS).toHaveLength(4);
    });

    it('includes all practice statuses', () => {
      const values = STATUS_OPTIONS.map((o) => o.value);
      expect(values).toContain('want-to-learn');
      expect(values).toContain('learning');
      expect(values).toContain('practiced');
      expect(values).toContain('mastered');
    });

    it('each option has a value and label', () => {
      for (const opt of STATUS_OPTIONS) {
        expect(typeof opt.value).toBe('string');
        expect(typeof opt.label).toBe('string');
        expect(opt.label.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('FavoriteToggle component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders unfavorited state by default', () => {
    const { getByText } = render(<FavoriteToggle songId="test-song" />);
    expect(getByText('Favorite')).toBeTruthy();
    expect(getByText('♡')).toBeTruthy();
  });

  it('toggles to favorited state on click', async () => {
    const { getByText, queryByText } = render(<FavoriteToggle songId="test-song" />);
    const button = getByText('Favorite').closest('button')!;
    await fireEvent.click(button);
    expect(getByText('Favorited')).toBeTruthy();
    expect(getByText('♥')).toBeTruthy();
  });

  it('stores favorite in localStorage when toggled', async () => {
    const { getByText } = render(<FavoriteToggle songId="test-song" />);
    const button = getByText('Favorite').closest('button')!;
    await fireEvent.click(button);
    const stored = getFavorite('test-song');
    expect(stored).not.toBeNull();
    expect(stored!.status).toBe('want-to-learn');
  });

  it('removes favorite from localStorage when untoggled', async () => {
    setFavorite('test-song', 'learning');
    const { getByText } = render(<FavoriteToggle songId="test-song" />);

    // Wait for useEffect to run
    await new Promise((r) => setTimeout(r, 10));

    const button = getByText('Favorited').closest('button')!;
    await fireEvent.click(button);
    expect(getFavorite('test-song')).toBeNull();
  });

  it('shows status dropdown when favorited', async () => {
    const { getByText, container } = render(<FavoriteToggle songId="test-song" />);
    const button = getByText('Favorite').closest('button')!;
    await fireEvent.click(button);
    const select = container.querySelector('select');
    expect(select).toBeTruthy();
  });

  it('does not show status dropdown when unfavorited', () => {
    const { container } = render(<FavoriteToggle songId="test-song" />);
    const select = container.querySelector('select');
    expect(select).toBeNull();
  });

  it('has correct aria-pressed attribute', async () => {
    const { getByText } = render(<FavoriteToggle songId="test-song" />);
    const button = getByText('Favorite').closest('button')!;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('loads existing favorite on mount', async () => {
    setFavorite('test-song', 'mastered');
    const { getByText } = render(<FavoriteToggle songId="test-song" />);

    // Wait for useEffect
    await new Promise((r) => setTimeout(r, 10));
    expect(getByText('Favorited')).toBeTruthy();
  });
});
