const BASE = 'https://api.mangadex.org';

function qs(params) {
  const parts = [];
  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val)) {
      val.forEach(v => parts.push(`${key}[]=${encodeURIComponent(v)}`));
    } else if (val !== undefined && val !== null && val !== '') {
      parts.push(`${key}=${encodeURIComponent(val)}`);
    }
  }
  return parts.join('&');
}

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function searchManga(query, page = 1) {
  const limit = 24;
  const offset = (page - 1) * limit;
  const q = qs({
    title: query,
    limit,
    offset,
    includes: ['cover_art'],
    originalLanguage: ['ko'],
    contentRating: ['safe', 'suggestive'],
    'order[relevance]': 'desc',
  });
  return apiFetch(`/manga?${q}`);
}

export async function getPopularManga(page = 1) {
  const limit = 24;
  const offset = (page - 1) * limit;
  const q = qs({
    limit,
    offset,
    includes: ['cover_art'],
    originalLanguage: ['ko'],
    contentRating: ['safe', 'suggestive'],
    'order[followedCount]': 'desc',
  });
  return apiFetch(`/manga?${q}`);
}

export async function getLatestManga(page = 1) {
  const limit = 24;
  const offset = (page - 1) * limit;
  const q = qs({
    limit,
    offset,
    includes: ['cover_art'],
    originalLanguage: ['ko'],
    contentRating: ['safe', 'suggestive'],
    'order[latestUploadedChapter]': 'desc',
  });
  return apiFetch(`/manga?${q}`);
}

export async function getMangaById(id) {
  const q = qs({ includes: ['cover_art', 'author', 'artist'] });
  return apiFetch(`/manga/${id}?${q}`);
}

export async function getMangaChapters(mangaId, page = 1) {
  const limit = 100;
  const offset = (page - 1) * limit;
  const q = qs({
    limit,
    offset,
    translatedLanguage: ['en'],
    'order[chapter]': 'asc',
    includes: ['scanlation_group'],
  });
  return apiFetch(`/manga/${mangaId}/feed?${q}`);
}

export async function getChapterPages(chapterId) {
  return apiFetch(`/at-home/server/${chapterId}`);
}

export function getCoverUrl(mangaId, filename, size = 512) {
  return `https://uploads.mangadex.org/covers/${mangaId}/${filename}.${size}.jpg`;
}

export function extractTitle(manga) {
  const t = manga.attributes?.title || {};
  return t.en || Object.values(t)[0] || 'Unknown';
}

export function extractCover(manga) {
  const rel = manga.relationships?.find(r => r.type === 'cover_art');
  if (!rel?.attributes?.fileName) return null;
  return getCoverUrl(manga.id, rel.attributes.fileName);
}
