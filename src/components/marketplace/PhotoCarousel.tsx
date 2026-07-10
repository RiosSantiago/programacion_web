import { useState, useRef, useEffect } from 'react';

interface PhotoCarouselProps {
  fotos: string[];
  videoUrl?: string;
  productoId?: number;
}


export default function PhotoCarousel({ fotos, videoUrl, productoId }: PhotoCarouselProps) {
  // Usar solo las fotos reales del producto, sin rellenos externos
  const allFotos = fotos.length > 0 ? [...fotos] : ['/images/ganado.svg'];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isFavorite, setIsFavorite] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Cargar estado de favoritos desde localStorage en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined' && productoId) {
      const favoritos = JSON.parse(localStorage.getItem('agroup_favoritos') || '[]');
      setIsFavorite(favoritos.includes(productoId));
    }
  }, [productoId]);

  // Alternar el estado de favorito
  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el clic active el zoom de la imagen
    if (!productoId) return;

    const favoritos = JSON.parse(localStorage.getItem('agroup_favoritos') || '[]');
    let nuevosFavoritos;
    if (isFavorite) {
      nuevosFavoritos = favoritos.filter((id: number) => id !== productoId);
    } else {
      nuevosFavoritos = [...favoritos, productoId];
    }

    localStorage.setItem('agroup_favoritos', JSON.stringify(nuevosFavoritos));
    setIsFavorite(!isFavorite);
  };

  // Navegar con animación de fade suave
  const goTo = (idx: number) => {
    if (isTransitioning || idx === currentIndex) return;
    setIsTransitioning(true);
    setZoomed(false); // Resetear zoom al cambiar de foto
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsTransitioning(false);
    }, 150);
  };

  const next = () => goTo((currentIndex + 1) % allFotos.length);
  const prev = () => goTo((currentIndex - 1 + allFotos.length) % allFotos.length);

  // Soporte swipe táctil para móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  // Calcular la posición del zoom según el puntero
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="space-y-3">

      {/* ── Imagen principal con navegación, favoritos y zoom interactivo ── */}
      <div
        className="relative rounded-2xl overflow-hidden bg-[#F0EBE1] border border-[#E8DDD0]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Contenedor de la imagen */}
        <div
          className={`aspect-[4/3] relative overflow-hidden select-none ${
            zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setZoomed(!zoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoomed(false)}
        >
          <img
            src={allFotos[currentIndex]}
            alt={`Foto ${currentIndex + 1} del animal`}
            className={`w-full h-full transition-transform duration-200 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            } ${zoomed ? 'scale-[2.2]' : 'object-contain'}`}
            style={{
              background: '#F0EBE1',
              transformOrigin: zoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
            }}
          />

          {/* Gradiente suave en la parte inferior */}
          {!zoomed && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
          )}

          {/* Badge contador de fotos */}
          {!zoomed && (
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {currentIndex + 1} / {allFotos.length}
            </div>
          )}

          {/* Botón de Favorito (Corazón flotante) */}
          {!zoomed && productoId && (
            <button
              onClick={toggleFavorite}
              aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              className="absolute top-3 right-3 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all border border-white/40 z-10"
            >
              {isFavorite ? (
                // Corazón relleno rojo
                <svg className="w-6 h-6 text-red-500 fill-current animate-heartbeat" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                // Corazón contorno
                <svg className="w-6 h-6 text-slate-700 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Lupa indicadora flotante (reubicada al fondo derecho) */}
          {!zoomed && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
              Haz clic para zoom
            </div>
          )}

          {/* Flechas de navegación (ocultas durante el zoom) */}
          {!zoomed && allFotos.length > 1 && (
            <>
              {/* Flecha izquierda */}
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 border border-white/40"
              >
                <svg className="w-5 h-5 text-[#5C3A1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Flecha derecha */}
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Siguiente foto"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 border border-white/40"
              >
                <svg className="w-5 h-5 text-[#5C3A1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Indicadores tipo pill en la parte inferior de la imagen */}
        {allFotos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2.5 bg-white/80 backdrop-blur-sm border-t border-[#E8DDD0]">
            {allFotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Ir a foto ${idx + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-5 h-2 bg-[#8B5E3C]'
                    : 'w-2 h-2 bg-[#C4A882] hover:bg-[#8B5E3C]/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Tira de miniaturas (thumbnail strip) ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {allFotos.map((foto, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Ver foto ${idx + 1}`}
            className={`shrink-0 w-[68px] h-[68px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              idx === currentIndex
                ? 'border-[#8B5E3C] scale-105 shadow-md opacity-100'
                : 'border-[#E8DDD0] opacity-65 hover:opacity-95 hover:border-[#C4A882]'
            }`}
          >
            <img
              src={foto}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}

        {/* Miniatura especial para video si existe */}
        {videoUrl && (
          <div className="shrink-0 w-[68px] h-[68px] rounded-xl overflow-hidden border-2 border-[#E8DDD0] relative group cursor-pointer hover:border-[#8B5E3C] transition-colors">
            <div className="w-full h-full bg-gradient-to-br from-[#2D1810] to-[#1C0F07] flex flex-col items-center justify-center gap-1">
              <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-[8px] text-white/50 font-medium">VIDEO</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Sección de video ── */}
      <div className="rounded-2xl overflow-hidden border border-[#E8DDD0] shadow-sm">
        {/* Encabezado del reproductor */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#F5F0E8] to-[#FAF7F2] border-b border-[#E8DDD0] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-xs font-semibold text-[#5C3A1E] uppercase tracking-wider">Video del animal</p>
        </div>

        {/* Reproductor real o placeholder premium */}
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full aspect-[4/3] object-cover bg-black"
          />
        ) : (
          /* Placeholder de video con diseño premium */
          <div className="aspect-[4/3] bg-gradient-to-br from-[#1C0F07] via-[#2D1810] to-[#3D2215] flex flex-col items-center justify-center gap-3 relative overflow-hidden">
            {/* Círculos decorativos de fondo */}
            <div className="absolute w-56 h-56 rounded-full border border-white/5 -top-16 -right-16 pointer-events-none" />
            <div className="absolute w-40 h-40 rounded-full border border-white/5 -bottom-10 -left-10 pointer-events-none" />
            {/* Ícono de play */}
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white/65 text-sm font-semibold">Video no disponible</p>
              <p className="text-white/35 text-xs mt-0.5">El vendedor aún no ha subido un video</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
