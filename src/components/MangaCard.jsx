import { Link } from 'react-router-dom';
import { extractTitle, extractCover } from '../api/mangadex';
import { Star } from 'lucide-react';

const STATUS_COLORS = {
  ongoing: 'bg-green-900/70 text-green-400',
  completed: 'bg-blue-900/70 text-blue-400',
  hiatus: 'bg-yellow-900/70 text-yellow-400',
  cancelled: 'bg-red-900/70 text-red-400',
};

export default function MangaCard({ manga }) {
  const title = extractTitle(manga);
  const cover = extractCover(manga);
  const status = manga.attributes?.status;
  const rating = manga.attributes?.rating?.bayesian;

  return (
    <Link to={`/manga/${manga.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#222] group-hover:border-purple-500/60 transition-all duration-200 shadow-lg">
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700">
            <BookOpen size={32} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        {status && (
          <div className={`absolute top-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_COLORS[status] || 'bg-gray-800 text-gray-400'}`}>
            {status}
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5 space-y-0.5">
        <p className="text-[13px] font-medium text-gray-200 line-clamp-2 group-hover:text-purple-300 transition-colors leading-snug">
          {title}
        </p>
        {rating != null && (
          <div className="flex items-center gap-1">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] text-gray-500">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
