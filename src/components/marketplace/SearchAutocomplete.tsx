import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  vendedor: string;
  ubicacion: string;
}

interface SearchAutocompleteProps {
  placeholder?: string;
}

export default function SearchAutocomplete({ placeholder = 'Buscar ganado, razas, haciendas...' }: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length <= 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    fetch(`/api/productos?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        const list = (data.productos || []).slice(0, 6);
        setResults(list);
        setIsOpen(list.length > 0);
      })
      .catch(() => {
        setResults([]);
        setIsOpen(false);
      })
      .finally(() => setIsLoading(false));
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/marketplace?q=${encodeURIComponent(query)}`;
      setIsOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    window.location.href = `/marketplace/${result.id}`;
    setIsOpen(false);
    setQuery('');
  };

  const formatPrice = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <div ref={containerRef} className="relative w-full nav-search-wrapper">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 1 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-3 bg-transparent border-2 border-white rounded-2xl text-sm text-white focus:bg-transparent focus:border-white focus:ring-4 focus:ring-white/20 transition-all duration-200 placeholder:text-white/60"
            autoComplete="off"
          />
          <button 
            type="submit"
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors nav-search-icon"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
            </svg>
          </button>
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setIsOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <p className="text-xs text-slate-400 font-medium">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-4 p-4 hover:bg-campo-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{result.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 capitalize">{result.categoria}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-xs text-slate-400">{result.vendedor}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-campo-600">{formatPrice(result.precio)}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <a 
              href={`/marketplace?q=${encodeURIComponent(query)}`}
              className="flex items-center justify-center gap-2 text-sm text-campo-600 font-medium hover:text-campo-700 transition-colors"
            >
              Ver todos los resultados
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}