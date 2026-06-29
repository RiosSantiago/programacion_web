import { useState } from 'react';

interface PhotoCarouselProps {
  fotos: string[];
}

export default function PhotoCarousel({ fotos }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const next = () => setCurrentIndex((prev) => (prev + 1) % fotos.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + fotos.length) % fotos.length);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-100">
      <div
        className="aspect-[4/3] relative cursor-crosshair"
        onClick={() => setZoomed(!zoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomed(false)}
      >
        <img
          src={fotos[currentIndex]}
          alt={`Foto ${currentIndex + 1}`}
          className={`w-full h-full transition-transform duration-200 ${
            zoomed ? 'scale-150' : 'object-contain'
          }`}
          style={
            zoomed
              ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
              : undefined
          }
        />
        {zoomed && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        {!zoomed && fotos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      {fotos.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {fotos.map((foto, idx) => (
            <button
              onClick={() => setCurrentIndex(idx)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                idx === currentIndex ? 'border-campo-500' : 'border-transparent'
              }`}
            >
              <img src={foto} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
