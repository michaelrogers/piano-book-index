import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import FavoritesList from '../components/FavoritesList';
import { setFavorite } from '../components/FavoriteToggle';
import type { SongSearchItem } from '../lib/types';

function makeSong(overrides: Partial<SongSearchItem> = {}): SongSearchItem {
  return {
    id: 'song-1',
    title: 'Test Song',
    composer: 'Test Composer',
    genre: 'Classical',
    genreTags: ['Classical'],
    bookId: 'book-1',
    bookTitle: 'Test Book',
    bookSeries: 'Test Series',
    bookType: 'companion',
    bookCoverImage: '/covers/test.jpg',
    bookPublisher: 'Test Publisher',
    difficultyLabel: 'Beginner',
    pageNumber: 10,
    hasVideo: false,
    ...overrides,
  };
}

describe('FavoritesList component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows empty state when no favorites', () => {
    const { getByText } = render(<FavoritesList songs={[makeSong()]} />);
    expect(getByText('No favorites yet')).toBeTruthy();
  });

  it('shows Browse Songs link in empty state', () => {
    const { container } = render(<FavoritesList songs={[makeSong()]} />);
    const link = container.querySelector('a[href="/"]');
    expect(link).toBeTruthy();
    expect(link!.textContent).toContain('Browse Songs');
  });

  it('displays favorited songs grouped by status', async () => {
    const songs = [
      makeSong({ id: 'song-1', title: 'Song A' }),
      makeSong({ id: 'song-2', title: 'Song B' }),
    ];
    setFavorite('song-1', 'learning');
    setFavorite('song-2', 'mastered');

    const { getByText, container } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    expect(getByText('2 songs favorited')).toBeTruthy();
    // Use getAllByText since "Learning" and "Mastered" appear in both group headers and select options
    const learningElements = container.querySelectorAll('h2');
    const headingTexts = Array.from(learningElements).map((h) => h.textContent);
    expect(headingTexts.some((t) => t?.includes('Learning'))).toBe(true);
    expect(headingTexts.some((t) => t?.includes('Mastered'))).toBe(true);
  });

  it('shows singular "song" when only 1 favorite', async () => {
    const songs = [makeSong({ id: 'song-1', title: 'Song A' })];
    setFavorite('song-1', 'learning');

    const { getByText } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    expect(getByText('1 song favorited')).toBeTruthy();
  });

  it('displays song title and composer', async () => {
    const songs = [makeSong({ id: 'song-1', title: 'Moonlight Sonata', composer: 'Beethoven' })];
    setFavorite('song-1', 'want-to-learn');

    const { getByText } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    expect(getByText('Moonlight Sonata')).toBeTruthy();
    expect(getByText(/Beethoven/)).toBeTruthy();
  });

  it('renders remove button for each favorite', async () => {
    const songs = [makeSong({ id: 'song-1' })];
    setFavorite('song-1', 'learning');

    const { container } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    const removeButton = container.querySelector('button[title="Remove from favorites"]');
    expect(removeButton).toBeTruthy();
  });

  it('removes favorite when remove button is clicked', async () => {
    const songs = [makeSong({ id: 'song-1' })];
    setFavorite('song-1', 'learning');

    const { container, getByText } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    const removeButton = container.querySelector('button[title="Remove from favorites"]')!;
    await fireEvent.click(removeButton);
    await new Promise((r) => setTimeout(r, 10));

    expect(getByText('No favorites yet')).toBeTruthy();
  });

  it('renders status dropdown for each favorite', async () => {
    const songs = [makeSong({ id: 'song-1' })];
    setFavorite('song-1', 'learning');

    const { container } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    const select = container.querySelector('select');
    expect(select).toBeTruthy();
    expect((select as HTMLSelectElement).value).toBe('learning');
  });

  it('ignores favorites for songs not in the provided list', async () => {
    const songs = [makeSong({ id: 'song-1', title: 'Known Song' })];
    setFavorite('song-1', 'learning');
    setFavorite('unknown-song', 'mastered');

    const { getByText, queryByText } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    expect(getByText('1 song favorited')).toBeTruthy();
    expect(getByText('Known Song')).toBeTruthy();
  });

  it('shows video icon for songs with video', async () => {
    const songs = [makeSong({ id: 'song-1', hasVideo: true })];
    setFavorite('song-1', 'want-to-learn');

    const { container } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    // YouTube icon SVG should be present
    const videoIcon = container.querySelector('svg[viewBox="0 0 24 24"][fill="currentColor"]');
    expect(videoIcon).toBeTruthy();
  });

  it('links to song detail page', async () => {
    const songs = [makeSong({ id: 'song-1' })];
    setFavorite('song-1', 'practiced');

    const { container } = render(<FavoritesList songs={songs} />);
    await new Promise((r) => setTimeout(r, 10));

    const link = container.querySelector('a[href="/songs/song-1"]');
    expect(link).toBeTruthy();
  });
});
