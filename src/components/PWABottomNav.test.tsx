import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/preact';
import PWABottomNav from '../components/PWABottomNav';

describe('PWABottomNav component', () => {
  beforeEach(() => {
    // Default: not standalone
    Object.defineProperty(navigator, 'standalone', {
      value: false,
      writable: true,
      configurable: true,
    });
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders nothing when not in standalone mode', () => {
    const { container } = render(<PWABottomNav currentPath="/" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nav when in standalone mode', async () => {
    Object.defineProperty(navigator, 'standalone', {
      value: true,
      writable: true,
      configurable: true,
    });
    const { container } = render(<PWABottomNav currentPath="/" />);
    await new Promise((r) => setTimeout(r, 10));

    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  it('renders 4 navigation tabs in standalone mode', async () => {
    Object.defineProperty(navigator, 'standalone', {
      value: true,
      writable: true,
      configurable: true,
    });
    const { container } = render(<PWABottomNav currentPath="/" />);
    await new Promise((r) => setTimeout(r, 10));

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(4);
  });

  it('has correct tab labels', async () => {
    Object.defineProperty(navigator, 'standalone', {
      value: true,
      writable: true,
      configurable: true,
    });
    const { getByText } = render(<PWABottomNav currentPath="/" />);
    await new Promise((r) => setTimeout(r, 10));

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Search')).toBeTruthy();
    expect(getByText('Books')).toBeTruthy();
    expect(getByText('Favorites')).toBeTruthy();
  });

  it('has correct href for each tab', async () => {
    Object.defineProperty(navigator, 'standalone', {
      value: true,
      writable: true,
      configurable: true,
    });
    const { container } = render(<PWABottomNav currentPath="/" />);
    await new Promise((r) => setTimeout(r, 10));

    const links = container.querySelectorAll('a');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/search', '/books', '/favorites']);
  });
});
