import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1f1f1f]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <BookOpen size={22} className="text-purple-500" />
          <span className="font-bold text-lg text-white tracking-tight">ManhwaVault</span>
        </Link>
        <span className="text-xs text-gray-600 border border-[#2a2a2a] rounded px-2 py-0.5">
          Personal Reader
        </span>
      </div>
    </nav>
  );
}
