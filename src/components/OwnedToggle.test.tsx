import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import OwnedToggle from '../components/OwnedToggle';

describe('OwnedToggle component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders with default label when not owned', () => {
    const { getByText } = render(<OwnedToggle bookId="book-1" />);
    expect(getByText('Add to Library')).toBeTruthy();
    expect(getByText('○')).toBeTruthy();
  });

  it('renders with custom label when provided', () => {
    const { getByText } = render(<OwnedToggle bookId="book-1" label="Own this" />);
    expect(getByText('Own this')).toBeTruthy();
  });

  it('toggles to owned state on click', async () => {
    const { getByText } = render(<OwnedToggle bookId="book-1" />);
    const button = getByText('Add to Library').closest('button')!;
    await fireEvent.click(button);
    expect(getByText('In Library')).toBeTruthy();
    expect(getByText('✓')).toBeTruthy();
  });

  it('stores owned state in localStorage', async () => {
    const { getByText } = render(<OwnedToggle bookId="book-1" />);
    const button = getByText('Add to Library').closest('button')!;
    await fireEvent.click(button);
    expect(localStorage.getItem('owned:book-1')).toBe('true');
  });

  it('unsets owned state on second click', async () => {
    const { getByText } = render(<OwnedToggle bookId="book-1" />);
    const button = getByText('Add to Library').closest('button')!;
    await fireEvent.click(button);
    await fireEvent.click(button);
    expect(localStorage.getItem('owned:book-1')).toBe('false');
    expect(getByText('Add to Library')).toBeTruthy();
  });

  it('dispatches owned-books-changed event', async () => {
    let eventDetail: any = null;
    window.addEventListener('owned-books-changed', ((e: CustomEvent) => {
      eventDetail = e.detail;
    }) as EventListener);

    const { getByText } = render(<OwnedToggle bookId="book-1" />);
    const button = getByText('Add to Library').closest('button')!;
    await fireEvent.click(button);

    expect(eventDetail).not.toBeNull();
    expect(eventDetail.bookId).toBe('book-1');
    expect(eventDetail.owned).toBe(true);
  });

  it('loads owned state from localStorage on mount', async () => {
    localStorage.setItem('owned:book-1', 'true');
    const { getByText } = render(<OwnedToggle bookId="book-1" />);

    // Wait for useEffect
    await new Promise((r) => setTimeout(r, 10));
    expect(getByText('In Library')).toBeTruthy();
  });

  it('has correct aria-pressed attribute', async () => {
    const { container, getByText } = render(<OwnedToggle bookId="book-1" />);
    const button = container.querySelector('button')!;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});
