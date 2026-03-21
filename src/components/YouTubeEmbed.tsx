import { useEffect, useRef } from 'preact/hooks';

interface Props {
  url: string;
  artist: string;
  description?: string;
  playlistId?: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/,
  );
  return match ? match[1] : null;
}

export default function YouTubeEmbed({ url, artist, description }: Props) {
  const videoId = getYouTubeId(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!videoId || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const autoplay = new URLSearchParams(window.location.search).get('autoplay') === '1';
    const params = new URLSearchParams({
      enablejsapi: '1',
      rel: '0',
      ...(autoplay ? { autoplay: '1' } : {}),
      origin: window.location.origin,
    });
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;

    // Listen for YouTube postMessage state changes
    function onMessage(e: MessageEvent) {
      if (e.origin !== 'https://www.youtube-nocookie.com') return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'onStateChange' && data.info === 0) {
          window.dispatchEvent(new CustomEvent('yt-video-ended'));
        }
      } catch {}
    }

    // Activate the JS API listener by sending a "listening" command
    function activateApi() {
      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: 'listening', id: videoId }),
          'https://www.youtube-nocookie.com',
        );
      } catch {}
    }

    window.addEventListener('message', onMessage);
    // The iframe needs a moment to be ready before we can activate the JS API
    iframe.addEventListener('load', () => {
      activateApi();
      // Retry a few times in case the first attempt is too early
      setTimeout(activateApi, 500);
      setTimeout(activateApi, 1500);
    });

    return () => window.removeEventListener('message', onMessage);
  }, [videoId]);

  if (!videoId) return null;

  return (
    <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="relative aspect-video">
        <iframe
          ref={iframeRef}
          class="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${artist} video`}
        />
      </div>
      <div class="bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
        <span class="font-medium text-gray-700 dark:text-gray-300">{artist}</span>
        {description && (
          <span class="text-gray-500 dark:text-gray-400"> &mdash; {description}</span>
        )}
      </div>
    </div>
  );
}
