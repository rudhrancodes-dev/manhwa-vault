import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react';

// MangaDex
import { getChapterPages as getMDPages, getMangaChapters, getMangaById, extractTitle } from '../api/mangadex';
// AsuraScans
import { getChapterPages as getAsuraPages, getSeriesChapters, getSeriesDetail } from '../api/asura';

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

// ── MangaDex reader ──────────────────────────────────────
function MangaDexReader({ mangaId, chapterId }) {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [mangaTitle, setMangaTitle] = useState('');
  const [currentChapter, setCurrentChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);

    Promise.all([
      getMDPages(chapterId),
      getMangaChapters(mangaId),
      getMangaById(mangaId),
    ]).then(([pagesData, chaptersData, mangaData]) => {
      if (cancelled) return;
      const { baseUrl, chapter: chData } = pagesData;
      setPages(chData.data.map(f => `${baseUrl}/data/${chData.hash}/${f}`));
      setChapters(chaptersData.data || []);
      setMangaTitle(extractTitle(mangaData.data));
      setCurrentChapter((chaptersData.data || []).find(c => c.id === chapterId) || null);
    }).catch(err => { if (!cancelled) setError('Failed to load chapter.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [chapterId, mangaId]);

  const currentIdx = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;
  const chNum = currentChapter?.attributes?.chapter || '?';

  const makePath = id => `/manga/mangadex/${mangaId}/chapter/${id}`;

  return (
    <ReaderLayout
      loading={loading} error={error}
      pages={pages} mangaTitle={mangaTitle} chapterNum={chNum}
      prevChapter={prevChapter ? makePath(prevChapter.id) : null}
      nextChapter={nextChapter ? makePath(nextChapter.id) : null}
      backPath={`/manga/mangadex/${mangaId}`}
      chapterSelector={
        <select value={chapterId} onChange={e => navigate(makePath(e.target.value))}
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1 max-w-[110px] focus:outline-none focus:border-purple-500">
          {chapters.map(ch => (
            <option key={ch.id} value={ch.id}>Ch.{ch.attributes.chapter || '?'}</option>
          ))}
        </select>
      }
      pdfImageUrls={pages}
      pdfTitle={mangaTitle}
      pdfChapter={chNum}
    />
  );
}

// ── AsuraScans reader ─────────────────────────────────────
function AsuraReader({ mangaId, chapterId }) {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [currentChapter, setCurrentChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);

    Promise.all([
      getAsuraPages(mangaId, chapterId),
      getSeriesChapters(mangaId),
      getSeriesDetail(mangaId),
    ]).then(([pagesData, chaptersData, seriesData]) => {
      if (cancelled) return;
      const chapter = pagesData?.data?.chapter || pagesData?.chapter || {};
      const pageUrls = (chapter.pages || []).map(p => p.url);
      setPages(pageUrls);

      const allChapters = (chaptersData.data || []).sort((a, b) => a.number - b.number);
      setChapters(allChapters);
      setCurrentChapter(allChapters.find(c => c.slug === chapterId) || null);
      setSeriesTitle((seriesData.series || seriesData)?.title || mangaId);
    }).catch(err => { if (!cancelled) setError('Failed to load chapter.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [chapterId, mangaId]);

  const currentIdx = chapters.findIndex(c => c.slug === chapterId);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;
  const chNum = currentChapter?.number || '?';

  const makePath = slug => `/manga/asura/${mangaId}/chapter/${slug}`;

  return (
    <ReaderLayout
      loading={loading} error={error}
      pages={pages} mangaTitle={seriesTitle} chapterNum={chNum}
      prevChapter={prevChapter ? makePath(prevChapter.slug) : null}
      nextChapter={nextChapter ? makePath(nextChapter.slug) : null}
      backPath={`/manga/asura/${mangaId}`}
      chapterSelector={
        <select value={chapterId} onChange={e => navigate(makePath(e.target.value))}
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1 max-w-[110px] focus:outline-none focus:border-purple-500">
          {[...chapters].reverse().map(ch => (
            <option key={ch.id} value={ch.slug}>Ch.{ch.number}</option>
          ))}
        </select>
      }
      pdfImageUrls={pages}
      pdfTitle={seriesTitle}
      pdfChapter={String(chNum)}
    />
  );
}

// ── Shared reader layout ──────────────────────────────────
function ReaderLayout({
  loading, error, pages, mangaTitle, chapterNum,
  prevChapter, nextChapter, backPath, chapterSelector,
  pdfImageUrls, pdfTitle, pdfChapter,
}) {
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [dlStatus, setDlStatus] = useState('');

  const downloadAsPDF = async () => {
    if (downloading || pdfImageUrls.length === 0) return;
    setDownloading(true);
    setDlProgress(0);
    setDlStatus('Preparing...');

    const { default: jsPDF } = await import('jspdf');

    try {
      let pdf = null;

      for (let i = 0; i < pdfImageUrls.length; i++) {
        setDlStatus(`Page ${i + 1} / ${pdfImageUrls.length}`);
        setDlProgress(Math.round((i / pdfImageUrls.length) * 90));

        let dataUrl;
        try {
          const proxyUrl = `/.netlify/functions/proxy?url=${encodeURIComponent(pdfImageUrls[i])}`;
          const res = await fetch(proxyUrl);
          if (!res.ok) throw new Error('proxy failed');
          const blob = await res.blob();
          dataUrl = await blobToDataUrl(blob);
        } catch {
          try {
            const res = await fetch(pdfImageUrls[i]);
            const blob = await res.blob();
            dataUrl = await blobToDataUrl(blob);
          } catch {
            continue;
          }
        }

        const { width, height } = await getImageDimensions(dataUrl);
        const PAGE_W = 595.28;
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
        const safeTitle = pdfTitle.replace(/[^a-z0-9\s]/gi, '').trim() || 'Manhwa';
        pdf.save(`${safeTitle} - Chapter ${pdfChapter}.pdf`);
      }
    } catch {
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
          <p className="text-gray-600 text-sm">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400">{error}</p>
          <Link to={backPath} className="text-purple-400 hover:text-purple-300 text-sm">← Back to series</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1a1a1a] px-3 h-12 flex items-center gap-2">
        <Link to={backPath} className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm text-white font-medium truncate hidden sm:block">{mangaTitle}</span>
          <span className="text-xs text-gray-600 flex-shrink-0">Ch.{chapterNum}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {prevChapter ? (
            <Link to={prevChapter} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition">
              <ChevronLeft size={16} />
            </Link>
          ) : (
            <span className="p-1.5 text-gray-800"><ChevronLeft size={16} /></span>
          )}

          {chapterSelector}

          {nextChapter ? (
            <Link to={nextChapter} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition">
              <ChevronRight size={16} />
            </Link>
          ) : (
            <span className="p-1.5 text-gray-800"><ChevronRight size={16} /></span>
          )}

          <button
            onClick={downloadAsPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-[#2a1a3a] text-white text-xs px-3 py-1.5 rounded-lg transition ml-1 min-w-[72px] justify-center"
          >
            {downloading ? (
              <><Loader2 size={12} className="animate-spin" /><span>{dlProgress}%</span></>
            ) : (
              <><Download size={12} /><span>PDF</span></>
            )}
          </button>
        </div>
      </div>

      {/* PDF progress toast */}
      {downloading && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={13} className="animate-spin text-purple-400" />
            <span className="text-xs text-white font-medium">Generating PDF</span>
          </div>
          <p className="text-xs text-gray-600 mb-2">{dlStatus}</p>
          <div className="w-full bg-[#0a0a0a] rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${dlProgress}%` }} />
          </div>
        </div>
      )}

      {/* Pages */}
      <div className="flex flex-col items-center">
        {pages.map((url, i) => (
          <img key={url + i} src={url} alt={`Page ${i + 1}`}
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
            <Link to={prevChapter}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#141414] border border-[#252525] rounded-xl text-sm hover:border-purple-500/50 transition">
              <ChevronLeft size={15} /> Prev
            </Link>
          )}
          <Link to={backPath}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#141414] border border-[#252525] rounded-xl text-sm hover:border-purple-500/50 transition">
            <BookOpen size={14} /> All Chapters
          </Link>
          {nextChapter && (
            <Link to={nextChapter}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm transition">
              Next <ChevronRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Route entry point ─────────────────────────────────────
export default function Reader() {
  const { source, id, chapterId } = useParams();
  const resolvedSource = source === 'asura' ? 'asura' : 'mangadex';

  return resolvedSource === 'asura'
    ? <AsuraReader mangaId={id} chapterId={chapterId} />
    : <MangaDexReader mangaId={id} chapterId={chapterId} />;
}
