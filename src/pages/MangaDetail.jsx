import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getMangaById,
  getMangaChapters,
  extractTitle,
  getCoverUrl,
} from '../api/mangadex';
import { BookOpen, ChevronDown, ChevronUp, Play } from 'lucide-react';
import Loading from '../components/Loading';

const STATUS_STYLE = {
  ongoing: 'bg-green-900/50 text-green-400 border-green-800/50',
  completed: 'bg-blue-900/50 text-blue-400 border-blue-800/50',
  hiatus: 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50',
  cancelled: 'bg-red-900/50 text-red-400 border-red-800/50',
};

export default function MangaDetail() {
  const { id } = useParams();
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
      .then(d => {
        setChapters(d.data || []);
        setTotalCh(d.total || 0);
      })
      .catch(console.error)
      .finally(() => setChaptersLoading(false));
  }, [id, chPage]);

  if (mangaLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-gray-500">
        Manga not found.{' '}
        <Link to="/" className="ml-2 text-purple-400">Go home</Link>
      </div>
    );
  }

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">{title}</h1>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {status && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            )}
            {rating != null && (
              <span className="text-sm text-yellow-400 font-medium">★ {rating.toFixed(2)}</span>
            )}
            {author && (
              <span className="text-sm text-gray-400">
                By <span className="text-gray-300">{author}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 10).map(tag => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-gray-400"
              >
                {tag.attributes.name.en}
              </span>
            ))}
          </div>

          <div className="text-sm text-gray-400 leading-relaxed mb-4">
            <p className={showDesc ? '' : 'line-clamp-3'}>{description}</p>
            {description.length > 150 && (
              <button
                onClick={() => setShowDesc(v => !v)}
                className="mt-1 flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs"
              >
                {showDesc ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
              </button>
            )}
          </div>

          {chapters.length > 0 && (
            <Link
              to={`/manga/${id}/chapter/${chapters[0].id}`}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-purple-900/30"
            >
              <Play size={14} fill="currentColor" />
              Start Reading
            </Link>
          )}
        </div>
      </div>

      {/* Chapters */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-purple-500" />
          <h2 className="text-base font-semibold text-white">
            Chapters
          </h2>
          <span className="text-xs text-gray-600 bg-[#1a1a1a] border border-[#252525] rounded-full px-2 py-0.5">
            {totalCh}
          </span>
        </div>

        {chaptersLoading ? (
          <Loading text="Loading chapters..." />
        ) : chapters.length === 0 ? (
          <div className="py-12 text-center text-gray-600 text-sm">
            No English chapters available yet.
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {chapters.map(ch => {
                const chNum = ch.attributes.chapter;
                const chTitle = ch.attributes.title;
                const pubDate = new Date(ch.attributes.publishAt);
                const group = ch.relationships?.find(r => r.type === 'scanlation_group')?.attributes?.name;

                return (
                  <Link
                    key={ch.id}
                    to={`/manga/${id}/chapter/${ch.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#111] hover:bg-[#181818] border border-transparent hover:border-[#252525] transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-gray-600 w-16 flex-shrink-0 font-mono">
                        Ch.{chNum || '?'}
                      </span>
                      <span className="text-sm text-gray-300 group-hover:text-white transition truncate">
                        {chTitle || `Chapter ${chNum || '?'}`}
                      </span>
                      {group && (
                        <span className="hidden sm:inline text-xs text-gray-600 flex-shrink-0">
                          {group}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 flex-shrink-0 ml-2">
                      {pubDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </Link>
                );
              })}
            </div>

            {totalChPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => setChPage(p => p - 1)}
                  disabled={chPage === 1}
                  className="px-4 py-1.5 bg-[#141414] border border-[#252525] rounded-lg text-sm disabled:opacity-30 hover:border-purple-500/50 transition"
                >
                  Prev
                </button>
                <span className="text-gray-600 text-sm">{chPage} / {totalChPages}</span>
                <button
                  onClick={() => setChPage(p => p + 1)}
                  disabled={chPage === totalChPages}
                  className="px-4 py-1.5 bg-[#141414] border border-[#252525] rounded-lg text-sm disabled:opacity-30 hover:border-purple-500/50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
