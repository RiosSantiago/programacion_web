import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  vendedor: string;
  ubicacion: string;
  imagen?: string;
  imagenes?: string[];
}

interface SearchAutocompleteProps {
  placeholder?: string;
}

const getCategoryIcon = (categoria: string): string => {
  const normalized = (categoria || '').toLowerCase().trim();
  if (normalized.startsWith('equin')) return '/images/categories/equino.webp';
  if (normalized.startsWith('bovin')) return '/images/categories/bovino.webp';
  if (normalized.startsWith('porcin')) return '/images/categories/porcino.webp';
  if (normalized.startsWith('ovin')) return '/images/categories/ovino.webp';
  if (normalized.startsWith('avicol') || normalized.startsWith('avícol')) return '/images/categories/avicola.webp';
  return '/images/default.svg';
};

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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </button>
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setIsOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden search-autocomplete-dropdown">
          <div className="p-2 border-b border-slate-100 search-dropdown-header">
            <p className="text-xs text-slate-400 font-medium">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-4 p-4 hover:bg-campo-50 transition-colors text-left search-dropdown-item"
              >
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl shrink-0 search-item-icon-wrapper overflow-hidden">
                  <img 
                    src={result.imagen || result.imagenes?.[0] || getCategoryIcon(result.categoria)} 
                    alt={result.nombre}
                    className="w-full h-full object-cover search-item-icon"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = getCategoryIcon(result.categoria); }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate search-item-title">{result.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 capitalize search-item-cat">{result.categoria}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-xs text-slate-400 search-item-vendor">{result.vendedor}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-campo-600 search-item-price">{formatPrice(result.precio)}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50 search-dropdown-footer">
            <a 
              href={`/marketplace?q=${encodeURIComponent(query)}`}
              className="flex items-center justify-center gap-2 text-sm text-campo-600 font-medium hover:text-campo-700 transition-colors search-dropdown-footer-link"
            >
              Ver todos los resultados
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* 
        Aislamos el dropdown de los selectores universales del Navbar de Astro 
        mediante selectores CSS con alta especificidad.
      */}
      <style>{`
        /* Anulamos herencias de color del Navbar de Astro en el Autocomplete */
        #main-nav .search-autocomplete-dropdown,
        #main-nav .search-autocomplete-dropdown * {
          opacity: 1 !important;
          filter: none !important;
        }
        
        #main-nav .search-autocomplete-dropdown .search-dropdown-header p {
          color: #94a3b8 !important;
        }

        #main-nav .search-autocomplete-dropdown .search-dropdown-item {
          background-color: transparent !important;
        }
        
        #main-nav .search-autocomplete-dropdown .search-dropdown-item:hover {
          background-color: #f0faf3 !important;
        }

        #main-nav .search-autocomplete-dropdown .search-item-title {
          color: #0f172a !important;
        }

        #main-nav .search-autocomplete-dropdown .search-item-cat {
          color: #64748b !important;
        }

        #main-nav .search-autocomplete-dropdown .search-item-vendor {
          color: #94a3b8 !important;
        }

        #main-nav .search-autocomplete-dropdown .search-item-price {
          color: #2D6A4F !important;
        }

        #main-nav .search-autocomplete-dropdown .search-dropdown-footer {
          background-color: #f8fafc !important;
        }

        #main-nav .search-autocomplete-dropdown .search-dropdown-footer-link {
          color: #2D6A4F !important;
        }

        #main-nav .search-autocomplete-dropdown .search-dropdown-footer-link:hover {
          color: #1B4332 !important;
        }

        #main-nav .search-autocomplete-dropdown .search-item-icon-wrapper {
          background-color: #f8fafc !important;
          border-color: #f1f5f9 !important;
        }

        #main-nav .search-autocomplete-dropdown .search-item-icon {
          filter: none !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}