import type { APIRoute } from 'astro';
import { buildSearchIndex } from '../../lib/data';

export const GET: APIRoute = () => {
  const summaries = buildSearchIndex().map((s) => ({
    id: s.id,
    title: s.title,
    composer: s.composer,
    bookTitle: s.bookTitle,
    difficultyLabel: s.difficultyLabel,
    bookCoverImage: s.bookCoverImage,
  }));
  return new Response(JSON.stringify(summaries), {
    headers: { 'Content-Type': 'application/json' },
  });
};
