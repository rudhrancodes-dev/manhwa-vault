function asuraFetch(path) {
  return fetch(`/.netlify/functions/asura?path=${encodeURIComponent(path)}`, {
    headers: { Accept: 'application/json' },
  }).then(res => {
    if (!res.ok) throw new Error(`AsuraScans API error: ${res.status}`);
    return res.json();
  });
}

export async function getPopularSeries(page = 1) {
  return asuraFetch(`/api/series?page=${page}&sort=bookmarks_count`);
}

export async function getLatestSeries(page = 1) {
  return asuraFetch(`/api/series?page=${page}&sort=last_chapter_at`);
}

export async function searchSeries(query) {
  return asuraFetch(`/api/search?q=${encodeURIComponent(query)}`);
}

export async function getSeriesDetail(slug) {
  return asuraFetch(`/api/series/${slug}`);
}

export async function getSeriesChapters(slug, page = 1) {
  return asuraFetch(`/api/series/${slug}/chapters?page=${page}`);
}

export async function getChapterPages(slug, chapterSlug) {
  return asuraFetch(`/api/series/${slug}/chapters/${chapterSlug}`);
}

export function normalizeItem(series) {
  const genres = Array.isArray(series.genres)
    ? series.genres
    : parseField(series.genres, []);
  return {
    id: series.slug,
    source: 'asura',
    title: series.title,
    cover: series.cover || null,
    status: series.status,
    rating: series.rating ? parseFloat(series.rating) : null,
    tags: genres.map(g => g.name),
    description: series.description
      ? series.description.replace(/<[^>]+>/g, '')
      : '',
    author: series.author,
    raw: series,
  };
}

function parseField(val, fallback) {
  if (typeof val === 'string') {
    try { return JSON.parse(val.replace(/'/g, '"')); } catch { return fallback; }
  }
  return val ?? fallback;
}
