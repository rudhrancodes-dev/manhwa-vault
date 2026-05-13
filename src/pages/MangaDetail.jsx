import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronUp, Play, ExternalLink } from 'lucide-react';
import Loading from '../components/Loading';

// MangaDex imports
import {
  getMangaById,
  getMangaChapters,
  extractTitle,
  getCoverUrl,
} from '../api/mangadex';

// AsuraScans imports
import {
  getSeriesDetail,
  getSeriesChapters,
} from '../api/asura';

const STATUS_STYLE = {
  ongoing: 'bg-green-900/50 text-green-400 border-green-800/50',
  completed: 'bg-blue-900/50 text-blue-400 border-blue-800/50',
  hiatus: 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50',
  cancelled: 'bg-red-900/50 text-red-400 border-red-800/50',
};

// ── MangaDex detail ──────────────────────────────────────
function MangaDexDetail({ id }) {
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [mangaLoading, setMangaLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [showDesc, setShowDesc] = useState(false);
  const [chPage, setChPage] = useState(1);
  const [totalCh, setTotalCh] = useState(0);

  useEffect(() => {
    getMangaById(id)
      .then(d => setManga(d.data))
      .catch(console.error)
      .finally(() => setMangaLoading(false));
  }, [id]);

  useEffect(() => {
    setChaptersLoading(true);
    getMangaChapters(id, chPage)
      .then(d => { setChapters(d.data || []); setTotalCh(d.total || 0); })
      .catch(console.error)
      .finally(() => setChaptersLoading(false));
  }, [id, chPage]);

  if (mangaLoading) return <Loading />;
  if (!manga) return <p className="text-center text-gray-500 py-20">Manga not found.</p>;

  const title = extractTitle(manga);
  const coverRel = manga.relationships?.find(r => r.type === 'cover_art');
  const coverUrl = coverRel?.attributes?.fileName
    ? getCoverUrl(manga.id, coverRel.attributes.fileName, 512)
    : null;
  const description =
    manga.attributes.description?.en ||
    Object.values(manga.attributes.description || {})[0] ||
    'No description available.';
  const tags = manga.attributes.tags || [];
  const status = manga.attributes.status;
  const author = manga.relationships?.find(r => r.type === 'author')?.attributes?.name;
  const rating = manga.attributes?.rating?.bayesian;
  const totalChPages = Math.ceil(totalCh / 100);

  return (
    <DetailLayout
      title={title}
      coverUrl={coverUrl}
      description={description}
      tags={tags.slice(0, 10).map(t => t.attributes.name.en)}
      status={status}
      author={author}
      rating={rating ? rating.toFixed(2) : null}
      showDesc={showDesc}
      setShowDesc={setShowDesc}
      startLink={chapters.length > 0 ? `/manga/mangadex/${id}/chapter/${chapters[0].id}` : null}
      chaptersLoading={chaptersLoading}
      totalCh={totalCh}
    >
      {chapters.map(ch => (
        <Link
          key={ch.id}
          to={`/manga/mangadex/${id}/chapter/${ch.id}`}
          className="flex items-center justify-between p-3 rounded-xl bg-[#111] hover:bg-[#181818] border border-transparent hover:border-[#252525] transition group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-gray-600 w-16 flex-shrink-0 font-mono">Ch.{ch.attributes.chapter || '?'}</span>
            <span className="text-sm text-gray-300 group-hover:text-white transition truncate">
              {ch.attributes.title || `Chapter ${ch.attributes.chapter || '?'}`}
            </span>
          </div>
          <span className="text-xs text-gray-700 flex-shrink-0 ml-2">
            {new Date(ch.attributes.publishAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </Link>
      ))}
      {totalChPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button onClick={() => setChPage(p => p - 1)} disabled={chPage === 1}
            className="px-4 py-1.5 bg-[#141414] border border-[#252525] rounded-lg text-sm disabled:opacity-30">Prev</button>
          <span className="text-gray-600 text-sm">{chPage} / {totalChPages}</span>
          <button onClick={() => setChPage(p => p + 1)} disabled={chPage === totalChPages}
            className="px-4 py-1.5 bg-[#141414] border border-[#252525] rounded-lg text-sm disabled:opacity-30">Next</button>
        </div>
      )}
    </DetailLayout>
  );
}

// ── AsuraScans detail ────────────────────────────────────
function AsuraDetail({ id }) {
  const [series, setSeries] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [showDesc, setShowDesc] = useState(false);
  const [totalCh, setTotalCh] = useState(0);

  useEffect(() => {
    getSeriesDetail(id)
      .then(d => setSeries(d.series || d))
      .catch(console.error)
      .finally(() => setSeriesLoading(false));

    getSeriesChapters(id)
      .then(d => {
        const data = d.data || [];
        // Sort ascending by chapter number
        data.sort((a, b) => a.number - b.number);
        setChapters(data);
        setTotalCh(data.length);
      })
      .catch(console.error)
      .finally(() => setChaptersLoading(false));
  }, [id]);

  if (seriesLoading) return <Loading />;
  if (!series) return <p className="text-center text-gray-500 py-20">Series not found.</p>;

  const genres = Array.isArray(series.genres)
    ? series.genres.map(g => g.name)
    : [];

  const description = series.description
    ? series.description.replace(/<[^>]+>/g, '')
    : 'No description available.';

  return (
    <DetailLayout
      title={series.title}
      coverUrl={series.cover}
      description={description}
      tags={genres.slice(0, 10)}
      status={series.status}
      author={series.author}
      rating={series.rating ? parseFloat(series.rating).toFixed(2) : null}
      showDesc={showDesc}
      setShowDesc={setShowDesc}
      startLink={chapters.length > 0 ? `/manga/asura/${id}/chapter/${chapters[0].slug}` : null}
      chaptersLoading={chaptersLoading}
      totalCh={totalCh}
      externalUrl={`https://asurascans.com/comics/${id}`}
    >
      {[...chapters].reverse().map(ch => (
        <Link
          key={ch.id}
          to={`/manga/asura/${id}/chapter/${ch.slug}`}
          className={`flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-[#252525] transition group ${
            ch.is_locked ? 'bg-[#0d0d0d] opacity-60 pointer-events-none' : 'bg-[#111] hover:bg-[#181818]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-gray-600 w-16 flex-shrink-0 font-mono">Ch.{ch.number}</span>
            <span className="text-sm text-gray-300 group-hover:text-white transition truncate">
              {ch.title || `Chapter ${ch.number}`}
            </span>
            {ch.is_locked && <span className="text-[10px] text-yellow-600 flex-shrink-0">🔒 Premium</span>}
          </div>
          <span className="text-xs text-gray-700 flex-shrink-0 ml-2">
            {new Date(ch.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </Link>
      ))}
    </DetailLayout>
  );
}

// ── Shared layout ─────────────────────────────────────────
function DetailLayout({
  title, coverUrl, description, tags, status, author, rating,
  showDesc, setShowDesc, startLink, chaptersLoading, totalCh, externalUrl, children,
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          <div className="w-40 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden bg-[#1a1a1a] border border-[#252525] shadow-2xl shadow-black/50">
            {coverUrl ? (
              <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700">
                <BookOpen size={40} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight flex-1">{title}</h1>
            {externalUrl && (
              <a href={externalUrl} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 p-1.5 text-gray-600 hover:text-purple-400 transition mt-1">
                <ExternalLink size={15} />
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {status && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            )}
            {rating != null && <span className="text-sm text-yellow-400 font-medium">★ {rating}</span>}
            {author && (
              <span className="text-sm text-gray-500">
                By <span className="text-gray-300">{author}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-gray-400">
                {tag}
              </span>
            ))}
          </div>

          <div className="text-sm text-gray-400 leading-relaxed mb-4">
            <p className={showDesc ? '' : 'line-clamp-3'}>{description}</p>
            {description.length > 150 && (
              <button onClick={() => setShowDesc(v => !v)}
                className="mt-1 flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs">
                {showDesc ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
              </button>
            )}
          </div>

          {startLink && (
            <Link to={startLink}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-purple-900/30">
              <Play size={14} fill="currentColor" />
              Start Reading
            </Link>
          )}
        </div>
      </div>

      {/* Chapter list */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={15} className="text-purple-500" />
          <h2 className="text-base font-semibold text-white">Chapters</h2>
          <span className="text-xs text-gray-600 bg-[#1a1a1a] border border-[#252525] rounded-full px-2 py-0.5">{totalCh}</span>
        </div>
        {chaptersLoading ? (
          <Loading text="Loading chapters..." />
        ) : (
          <div className="space-y-1">{children}</div>
        )}
      </div>
    </div>
  );
}

// ── Route entry point ─────────────────────────────────────
export default function MangaDetail() {
  const { source, id } = useParams();
  // Handle legacy routes (no source param) — treat as mangadex
  const resolvedSource = source === 'asura' ? 'asura' : 'mangadex';
  const resolvedId = id;

  return resolvedSource === 'asura'
    ? <AsuraDetail id={resolvedId} />
    : <MangaDexDetail id={resolvedId} />;
}
