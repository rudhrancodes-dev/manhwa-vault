import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MangaDetail from './pages/MangaDetail';
import Reader from './pages/Reader';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
            </>
          }
        />
        <Route
          path="/manga/:id"
          element={
            <>
              <Navbar />
              <MangaDetail />
            </>
          }
        />
        <Route path="/manga/:id/chapter/:chapterId" element={<Reader />} />
      </Routes>
    </div>
  );
}
