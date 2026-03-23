import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import ThemeToggle from '../components/ThemeToggle';

describe('ThemeToggle component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders with "Dark" label by default (light theme)', () => {
    const { getByText } = render(<ThemeToggle />);
    expect(getByText('Dark')).toBeTruthy();
  });

  it('toggles to dark theme on click', async () => {
    const { getByText } = render(<ThemeToggle />);
    const button = getByText('Dark');
    await fireEvent.click(button);
    expect(getByText('Light')).toBeTruthy();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles back to light theme on second click', async () => {
    const { getByText } = render(<ThemeToggle />);
    await fireEvent.click(getByText('Dark'));
    await fireEvent.click(getByText('Light'));
    expect(getByText('Dark')).toBeTruthy();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('applies dark class to document element when toggling to dark', async () => {
    const { getByText } = render(<ThemeToggle />);
    await fireEvent.click(getByText('Dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when toggling to light', async () => {
    const { getByText } = render(<ThemeToggle />);
    await fireEvent.click(getByText('Dark'));
    await fireEvent.click(getByText('Light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('has a title attribute reflecting current theme', () => {
    const { container } = render(<ThemeToggle />);
    const button = container.querySelector('button')!;
    expect(button.getAttribute('title')).toBe('Theme: light');
  });
});
