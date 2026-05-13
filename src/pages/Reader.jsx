import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getChapterPages,
  getMangaChapters,
  getMangaById,
  extractTitle,
} from '../api/mangadex';
import {
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
} from 'lucide-react';
// jsPDF loaded on-demand to keep initial bundle small

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

export default function Reader() {
  const { id: mangaId, chapterId } = useParams();
  const navigate = useNavigate();

  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [mangaTitle, setMangaTitle] = useState('');
  const [currentChapter, setCurrentChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [dlStatus, setDlStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);

    async function load() {
      try {
        const [pagesData, chaptersData, mangaData] = await Promise.all([
          getChapterPages(chapterId),
          getMangaChapters(mangaId),
          getMangaById(mangaId),
        ]);

        if (cancelled) return;

        const { baseUrl, chapter: chData } = pagesData;
        const imageUrls = chData.data.map(
          f => `${baseUrl}/data/${chData.hash}/${f}`
        );

        setPages(imageUrls);
        setChapters(chaptersData.data || []);
        setMangaTitle(extractTitle(mangaData.data));
        setCurrentChapter(
          (chaptersData.data || []).find(c => c.id === chapterId) || null
        );
      } catch (err) {
        if (!cancelled) setError('Failed to load chapter.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [chapterId, mangaId]);

  const currentIdx = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;
  const chapterNum = currentChapter?.attributes?.chapter || '?';

  const downloadAsPDF = async () => {
    if (downloading || pages.length === 0) return;
    setDownloading(true);
    setDlProgress(0);
    setDlStatus('Preparing...');

    const { default: jsPDF } = await import('jspdf');

    try {
      let pdf = null;

      for (let i = 0; i < pages.length; i++) {
        setDlStatus(`Page ${i + 1} / ${pages.length}`);
        setDlProgress(Math.round((i / pages.length) * 90));

        let dataUrl;
        try {
          // Fetch via Netlify proxy (handles CORS for CDN images)
          const proxyUrl = `/.netlify/functions/proxy?url=${encodeURIComponent(pages[i])}`;
          const res = await fetch(proxyUrl);
          if (!res.ok) throw new Error('proxy failed');
          const blob = await res.blob();
          dataUrl = await blobToDataUrl(blob);
        } catch {
          // Fallback: try direct fetch (works if CORS is open)
          try {
            const res = await fetch(pages[i]);
            const blob = await res.blob();
            dataUrl = await blobToDataUrl(blob);
          } catch {
            continue; // skip page on failure
          }
        }

        const { width, height } = await getImageDimensions(dataUrl);
        const PAGE_W = 595.28; // A4 width in pt
        const PAGE_H = Math.round((height / width) * PAGE_W);

        if (!pdf) {
          pdf = new jsPDF({ unit: 'pt', format: [PAGE_W, PAGE_H] });
        } else {
          pdf.addPage([PAGE_W, PAGE_H]);
        }

        pdf.addImage(dataUrl, 'JPEG', 0, 0, PAGE_W, PAGE_H);
      }

      setDlProgress(100);
      setDlStatus('Saving...');

      if (pdf) {
        const safeTitle = mangaTitle.replace(/[^a-z0-9\s]/gi, '').trim() || 'Manhwa';
        pdf.save(`${safeTitle} - Chapter ${chapterNum}.pdf`);
      }
    } catch (err) {
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
      setDlProgress(0);
      setDlStatus('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400">{error}</p>
          <Link to={`/manga/${mangaId}`} className="text-purple-400 hover:text-purple-300 text-sm">
            ← Back to manga
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1a1a1a] px-3 h-12 flex items-center gap-2">
        <Link
          to={`/manga/${mangaId}`}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition"
          title="Back to manga"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm text-white font-medium truncate hidden sm:block">{mangaTitle}</span>
          <span className="text-xs text-gray-600 flex-shrink-0">Ch.{chapterNum}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Prev chapter */}
          {prevChapter ? (
            <Link
              to={`/manga/${mangaId}/chapter/${prevChapter.id}`}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition"
              title={`Ch.${prevChapter.attributes.chapter}`}
            >
              <ChevronLeft size={16} />
            </Link>
          ) : (
            <span className="p-1.5 text-gray-800 cursor-not-allowed">
              <ChevronLeft size={16} />
            </span>
          )}

          {/* Chapter selector */}
          <select
            value={chapterId}
            onChange={e => navigate(`/manga/${mangaId}/chapter/${e.target.value}`)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1 max-w-[110px] focus:outline-none focus:border-purple-500"
          >
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>
                Ch.{ch.attributes.chapter || '?'}{ch.attributes.title ? ` - ${ch.attributes.title}` : ''}
              </option>
            ))}
          </select>

          {/* Next chapter */}
          {nextChapter ? (
            <Link
              to={`/manga/${mangaId}/chapter/${nextChapter.id}`}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition"
              title={`Ch.${nextChapter.attributes.chapter}`}
            >
              <ChevronRight size={16} />
            </Link>
          ) : (
            <span className="p-1.5 text-gray-800 cursor-not-allowed">
              <ChevronRight size={16} />
            </span>
          )}

          {/* PDF Download */}
          <button
            onClick={downloadAsPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-[#2a1a3a] text-white text-xs px-3 py-1.5 rounded-lg transition ml-1 min-w-[80px] justify-center"
          >
            {downloading ? (
              <>
                <Loader2 size={12} className="animate-spin flex-shrink-0" />
                <span>{dlProgress}%</span>
              </>
            ) : (
              <>
                <Download size={12} />
                <span>PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Download progress */}
      {downloading && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={14} className="animate-spin text-purple-400" />
            <span className="text-xs text-white font-medium">Generating PDF</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">{dlStatus}</div>
          <div className="w-full bg-[#0a0a0a] rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${dlProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pages – webtoon vertical scroll */}
      <div className="flex flex-col items-center">
        {pages.map((url, i) => (
          <img
            key={url}
            src={url}
            alt={`Page ${i + 1}`}
            className="w-full max-w-3xl block"
            loading={i < 4 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="py-10 flex flex-col items-center gap-5">
        <p className="text-xs text-gray-700">{pages.length} pages · Chapter {chapterNum}</p>
        <div className="flex gap-3">
          {prevChapter && (
            <Link
              to={`/manga/${mangaId}/chapter/${prevChapter.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#141414] border border-[#252525] rounded-xl text-sm hover:border-purple-500/50 transition"
            >
              <ChevronLeft size={15} />
              Ch.{prevChapter.attributes.chapter}
            </Link>
          )}
          <Link
            to={`/manga/${mangaId}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#141414] border border-[#252525] rounded-xl text-sm hover:border-purple-500/50 transition"
          >
            <BookOpen size={14} />
            All Chapters
          </Link>
          {nextChapter && (
            <Link
              to={`/manga/${mangaId}/chapter/${nextChapter.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm transition"
            >
              Ch.{nextChapter.attributes.chapter}
              <ChevronRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
