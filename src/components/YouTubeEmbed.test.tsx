import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import YouTubeEmbed from '../components/YouTubeEmbed';

// We need to test the getYouTubeId function indirectly since it's not exported.
// We test it by checking whether the component renders (valid URL) or returns null (invalid URL).

describe('YouTubeEmbed component', () => {
  it('renders an iframe for a standard youtube.com/watch URL', () => {
    const { container } = render(
      <YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" artist="Test Artist" />,
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
  });

  it('renders an iframe for a youtu.be short URL', () => {
    const { container } = render(
      <YouTubeEmbed url="https://youtu.be/dQw4w9WgXcQ" artist="Test Artist" />,
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
  });

  it('renders an iframe for an embed URL', () => {
    const { container } = render(
      <YouTubeEmbed url="https://www.youtube.com/embed/dQw4w9WgXcQ" artist="Test Artist" />,
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
  });

  it('renders nothing for an invalid URL', () => {
    const { container } = render(
      <YouTubeEmbed url="https://example.com/video" artist="Test Artist" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for an empty URL', () => {
    const { container } = render(<YouTubeEmbed url="" artist="Test Artist" />);
    expect(container.innerHTML).toBe('');
  });

  it('displays the artist name', () => {
    const { getByText } = render(
      <YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" artist="Karen Rock Music" />,
    );
    expect(getByText('Karen Rock Music')).toBeTruthy();
  });

  it('displays the description when provided', () => {
    const { getByText } = render(
      <YouTubeEmbed
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        artist="Test Artist"
        description="A great performance"
      />,
    );
    expect(getByText(/A great performance/)).toBeTruthy();
  });

  it('does not display description when not provided', () => {
    const { container } = render(
      <YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" artist="Test Artist" />,
    );
    // Only the artist should be in the info bar
    const infoBar = container.querySelector('.bg-gray-50');
    expect(infoBar?.querySelectorAll('span')).toHaveLength(1);
  });

  it('sets correct iframe title for accessibility', () => {
    const { container } = render(
      <YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" artist="Piano Man" />,
    );
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('title')).toBe('Piano Man video');
  });

  it('renders with aspect-video container', () => {
    const { container } = render(
      <YouTubeEmbed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" artist="Test" />,
    );
    const aspectContainer = container.querySelector('.aspect-video');
    expect(aspectContainer).toBeTruthy();
  });

  it('handles watch URL with extra parameters', () => {
    const { container } = render(
      <YouTubeEmbed
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLx&index=3"
        artist="Test"
      />,
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
  });
});
