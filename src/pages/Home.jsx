import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { searchManga, getPopularManga, getLatestManga } from '../api/mangadex';
import MangaCard from '../components/MangaCard';
import Loading from '../components/Loading';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState('popular');
  const [input, setInput] = useState('');

  const query = searchParams.get('q') || '';

  useEffect(() => {
    setInput(query);
  }, [query]);

  const loadMangas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (query) {
        result = await searchManga(query, page);
      } else if (tab === 'popular') {
        result = await getPopularManga(page);
      } else {
        result = await getLatestManga(page);
      }
      setMangas(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError('Failed to load. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [query, tab, page]);

  useEffect(() => {
    loadMangas();
  }, [loadMangas]);

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

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero / Search */}
      <div className="mb-8">
        {!query && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">
              Discover <span className="text-purple-400">Manhwa</span>
            </h1>
            <p className="text-gray-500 text-sm">Browse thousands of Korean comics, read online, download as PDF.</p>
          </div>
        )}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Search manhwa title..."
              className="w-full bg-[#141414] border border-[#252525] text-white pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-500/70 transition placeholder:text-gray-600"
            />
            {input && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      {!query && (
        <div className="flex gap-1 mb-6">
          <button
            onClick={() => { setTab('popular'); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === 'popular'
                ? 'bg-purple-600 text-white'
                : 'bg-[#141414] text-gray-400 hover:text-white border border-[#252525]'
            }`}
          >
            <TrendingUp size={14} />
            Popular
          </button>
          <button
            onClick={() => { setTab('latest'); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === 'latest'
                ? 'bg-purple-600 text-white'
                : 'bg-[#141414] text-gray-400 hover:text-white border border-[#252525]'
            }`}
          >
            <Clock size={14} />
            Latest
          </button>
        </div>
      )}

      {/* Search header */}
      {query && !loading && (
        <div className="mb-5 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            <span className="text-white font-medium">{total}</span> results for &ldquo;{query}&rdquo;
          </p>
          <button onClick={clearSearch} className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
            <X size={13} />
            Clear
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-400 mb-3">{error}</p>
          <button onClick={loadMangas} className="text-sm text-purple-400 hover:text-purple-300">
            Retry
          </button>
        </div>
      ) : mangas.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="text-lg">No results found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {mangas.map(m => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && !error && (
        <div className="flex justify-center items-center gap-3 mt-10">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-[#141414] border border-[#252525] text-sm disabled:opacity-30 hover:border-purple-500/50 transition"
          >
            ← Prev
          </button>
          <span className="text-gray-500 text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-[#141414] border border-[#252525] text-sm disabled:opacity-30 hover:border-purple-500/50 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
