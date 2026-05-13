import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, TrendingUp, Clock, BookOpen, Zap } from 'lucide-react';
import {
  searchManga,
  getPopularManga,
  getLatestManga,
  normalizeItem as normalizeMD,
} from '../api/mangadex';
import {
  getPopularSeries,
  getLatestSeries,
  searchSeries,
  normalizeItem as normalizeAsura,
} from '../api/asura';
import MangaCard from '../components/MangaCard';
import Loading from '../components/Loading';

const SOURCES = [
  { id: 'asura', label: 'AsuraScans', icon: Zap, desc: 'Direct from asurascans.com' },
  { id: 'mangadex', label: 'MangaDex', icon: BookOpen, desc: 'Korean manhwa library' },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState('popular');
  const [source, setSource] = useState('asura');
  const [input, setInput] = useState('');

  const query = searchParams.get('q') || '';

  useEffect(() => { setInput(query); }, [query]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (source === 'asura') {
        let result;
        if (query) {
          result = await searchSeries(query);
          const data = result.data || [];
          setItems(data.map(normalizeAsura));
          setTotal(result.meta?.total || data.length);
        } else if (tab === 'popular') {
          result = await getPopularSeries(page);
          setItems((result.data || []).map(normalizeAsura));
          setTotal(result.meta?.total || 0);
        } else {
          result = await getLatestSeries(page);
          setItems((result.data || []).map(normalizeAsura));
          setTotal(result.meta?.total || 0);
        }
      } else {
        let result;
        if (query) {
          result = await searchManga(query, page);
        } else if (tab === 'popular') {
          result = await getPopularManga(page);
        } else {
          result = await getLatestManga(page);
        }
        setItems((result.data || []).map(normalizeMD));
        setTotal(result.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [source, query, tab, page]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    setPage(1);
    if (trimmed) setSearchParams({ q: trimmed });
    else setSearchParams({});
  };

  const clearSearch = () => {
    setInput('');
    setPage(1);
    setSearchParams({});
  };

  const switchSource = (s) => {
    setSource(s);
    setPage(1);
    if (query) setSearchParams({});
  };

  const perPage = source === 'asura' ? 20 : 24;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Source selector */}
      <div className="flex gap-2 mb-6">
        {SOURCES.map(s => {
          const Icon = s.icon;
          const active = source === s.id;
          return (
            <button
              key={s.id}
              onClick={() => switchSource(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                active
                  ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-[#111] border-[#252525] text-gray-400 hover:text-white hover:border-[#3a3a3a]'
              }`}
            >
              <Icon size={14} />
              {s.label}
              {active && <span className="text-[10px] opacity-70 hidden sm:inline">{s.desc}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6">
        {!query && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white">
              Discover <span className="text-purple-400">Manhwa</span>
            </h1>
            <p className="text-gray-600 text-sm mt-0.5">
              {source === 'asura' ? 'Powered by AsuraScans.com' : 'Korean manhwa from MangaDex'}
            </p>
          </div>
        )}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Search ${source === 'asura' ? 'AsuraScans' : 'MangaDex'}...`}
              className="w-full bg-[#111] border border-[#252525] text-white pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-500/70 transition placeholder:text-gray-700"
            />
            {input && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                <X size={13} />
              </button>
            )}
          </div>
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      {!query && (
        <div className="flex gap-1.5 mb-6">
          <button
            onClick={() => { setTab('popular'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === 'popular'
                ? 'bg-[#1a1a1a] text-white border border-purple-500/50'
                : 'bg-[#111] text-gray-500 border border-[#252525] hover:text-gray-300'
            }`}
          >
            <TrendingUp size={12} />
            Popular
          </button>
          <button
            onClick={() => { setTab('latest'); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === 'latest'
                ? 'bg-[#1a1a1a] text-white border border-purple-500/50'
                : 'bg-[#111] text-gray-500 border border-[#252525] hover:text-gray-300'
            }`}
          >
            <Clock size={12} />
            Latest
          </button>
        </div>
      )}

      {/* Search header */}
      {query && !loading && (
        <div className="mb-5 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            <span className="text-white font-medium">{total}</span> results for &ldquo;{query}&rdquo;
          </p>
          <button onClick={clearSearch} className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1">
            <X size={11} /> Clear
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-400 mb-3 text-sm">{error}</p>
          <button onClick={loadItems} className="text-sm text-purple-400 hover:text-purple-300">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-700">
          <p>No results found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map(item => (
            <MangaCard key={`${item.source}-${item.id}`} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && !error && (
        <div className="flex justify-center items-center gap-3 mt-10">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-[#111] border border-[#252525] text-sm disabled:opacity-30 hover:border-purple-500/50 transition"
          >
            ← Prev
          </button>
          <span className="text-gray-600 text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-[#111] border border-[#252525] text-sm disabled:opacity-30 hover:border-purple-500/50 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
