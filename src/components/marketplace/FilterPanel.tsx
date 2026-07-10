import { useState, useEffect, useRef } from 'react';

interface FilterPanelProps {
  initialCategoria?: string;
  initialMunicipio?: string;
  initialPrecioMin?: string;
  initialPrecioMax?: string;
  initialRaza?: string;
  initialSexo?: string;
  initialTipoPrecio?: string;
  initialTrazabilidad?: string;
  initialFechaPublicacion?: string;
  initialDestacados?: string;
}

const categorias = [
  { value: 'todos', label: 'Todos' },
  { value: 'bovino', label: 'Bovinos' },
  { value: 'equino', label: 'Equinos' },
  { value: 'porcino', label: 'Porcinos' },
  { value: 'ovino', label: 'Ovinos' },
  { value: 'avicola', label: 'Avícolas' },
  { value: 'agricultura', label: 'Agricultura' },
  { value: 'insumos', label: 'Insumos' },
];

const municipiosCaldas = [
  { value: 'Aguadas', label: 'Aguadas' },
  { value: 'Anserma', label: 'Anserma' },
  { value: 'Belalcázar', label: 'Belalcázar' },
  { value: 'Chinchiná', label: 'Chinchiná' },
  { value: 'Filadelfia', label: 'Filadelfia' },
  { value: 'La Dorada', label: 'La Dorada' },
  { value: 'La Merced', label: 'La Merced' },
  { value: 'Manizales', label: 'Manizales' },
  { value: 'Manzanares', label: 'Manzanares' },
  { value: 'Marmato', label: 'Marmato' },
  { value: 'Marquetalia', label: 'Marquetalia' },
  { value: 'Marulanda', label: 'Marulanda' },
  { value: 'Neira', label: 'Neira' },
  { value: 'Norcasia', label: 'Norcasia' },
  { value: 'Pácora', label: 'Pácora' },
  { value: 'Palestina', label: 'Palestina' },
  { value: 'Riosucio', label: 'Riosucio' },
  { value: 'Risaralda', label: 'Risaralda' },
  { value: 'Salamina', label: 'Salamina' },
  { value: 'Samaná', label: 'Samaná' },
  { value: 'San Félix', label: 'San Félix' },
  { value: 'San José', label: 'San José' },
  { value: 'Supía', label: 'Supía' },
  { value: 'Victoria', label: 'Victoria' },
  { value: 'Villamaría', label: 'Villamaría' },
  { value: 'Viterbo', label: 'Viterbo' },
];

const sexoOptions = [
  { value: 'macho', label: 'Macho' },
  { value: 'hembra', label: 'Hembra' },
];

const tipoPrecioOptions = [
  { value: 'fijo', label: 'Precio Fijo' },
  { value: 'negociable', label: 'Negociable' },
];

const fechaPublicacionOptions = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
];

const parseCSV = (val: string | undefined): string[] => {
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
};

const joinCSV = (arr: string[]): string =>
  arr.length > 0 ? arr.join(',') : '';

export default function FilterPanel({
  initialCategoria = 'todos',
  initialMunicipio = '',
  initialPrecioMin = '',
  initialPrecioMax = '',
  initialRaza = '',
  initialSexo = '',
  initialTipoPrecio = '',
  initialTrazabilidad = '',
  initialFechaPublicacion = '',
  initialDestacados = '',
}: FilterPanelProps) {
  const [categoriasSel, setCategoriasSel] = useState<string[]>(
    initialCategoria && initialCategoria !== 'todos' ? parseCSV(initialCategoria) : []
  );
  const [municipiosSel, setMunicipiosSel] = useState<string[]>(parseCSV(initialMunicipio));
  const [precioMin, setPrecioMin] = useState(initialPrecioMin);
  const [precioMax, setPrecioMax] = useState(initialPrecioMax);
  const [raza, setRaza] = useState(initialRaza);
  const [sexosSel, setSexosSel] = useState<string[]>(parseCSV(initialSexo));
  const [tipoPreciosSel, setTipoPreciosSel] = useState<string[]>(parseCSV(initialTipoPrecio));
  const [trazabilidad, setTrazabilidad] = useState(initialTrazabilidad === 'true');
  const [fechasSel, setFechasSel] = useState<string[]>(parseCSV(initialFechaPublicacion));
  const [destacados, setDestacados] = useState(initialDestacados === 'true');

  const applyFilters = () => {
    const params = new URLSearchParams(window.location.search);


    params.delete('page');
    params.delete('pagina');


    if (categoriasSel.length > 0) params.set('categoria', joinCSV(categoriasSel));
    else params.delete('categoria');

    if (municipiosSel.length > 0) params.set('municipio', joinCSV(municipiosSel));
    else params.delete('municipio');

    if (precioMin) params.set('precio_min', precioMin);
    else params.delete('precio_min');

    if (precioMax) params.set('precio_max', precioMax);
    else params.delete('precio_max');

    if (raza) params.set('raza', raza);
    else params.delete('raza');

    if (sexosSel.length > 0) params.set('sexo', joinCSV(sexosSel));
    else params.delete('sexo');

    if (tipoPreciosSel.length > 0) params.set('tipo_precio', joinCSV(tipoPreciosSel));
    else params.delete('tipo_precio');

    if (trazabilidad) params.set('trazabilidad', 'true');
    else params.delete('trazabilidad');

    if (fechasSel.length > 0) params.set('fecha_publicacion', joinCSV(fechasSel));
    else params.delete('fecha_publicacion');

    if (destacados) params.set('destacados', 'true');
    else params.delete('destacados');

    window.location.href = '/marketplace?' + params.toString();
  };

  const toggleCategoria = (val: string) => {
    setCategoriasSel(prev => {
      if (val === 'todos') return [];
      const next = prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val];
      return next;
    });
  };

  const toggleMunicipio = (val: string) => {
    setMunicipiosSel(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const toggleSexo = (val: string) => {
    setSexosSel(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const toggleTipoPrecio = (val: string) => {
    setTipoPreciosSel(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const toggleFecha = (val: string) => {
    setFechasSel(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const clearFilters = () => {
    window.location.href = '/marketplace';
  };

  const tieneFiltrosActivos = categoriasSel.length > 0 || municipiosSel.length > 0 ||
    precioMin || precioMax || raza || sexosSel.length > 0 ||
    tipoPreciosSel.length > 0 || trazabilidad || fechasSel.length > 0 || destacados;

  const MultiSelectDropdown = ({
    label,
    options,
    selected,
    onToggle,
    showSearch = false,
  }: {
    label: string;
    options: { value: string; label: string }[];
    selected: string[];
    onToggle: (val: string) => void;
    showSearch?: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filtered = showSearch
      ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
            selected.length > 0
              ? 'bg-campo-600 text-white border-campo-600'
              : 'bg-white/20 text-white/90 border-transparent hover:bg-white/30'
          }`}
        >
          {selected.length > 0 ? `${selected.length} seleccionados` : label}
          <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {selected.map(v => {
              const opt = options.find(o => o.value === v);
              return opt ? (
                <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-campo-50 text-campo-700 rounded-md text-[10px] font-semibold">
                  {opt.label}
                  <button onClick={() => onToggle(v)} className="hover:text-campo-900">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-[9999] p-3 max-h-64 overflow-hidden flex flex-col">
            {showSearch && (
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-campo-400 focus:ring-2 focus:ring-campo-100 outline-none mb-2"
                autoFocus
              />
            )}
            <div className="overflow-y-auto flex-1 space-y-0.5">
              {filtered.map((o) => (
                <label
                  key={o.value}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                    selected.includes(o.value) ? 'bg-campo-50 text-campo-700' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(o.value)}
                    onChange={() => onToggle(o.value)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-campo-600 focus:ring-campo-500"
                  />
                  {o.label}
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Sin resultados</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="font-bold text-white text-sm">Filtros</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 items-start">
        {/* Categoría */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Categoría</label>
          <MultiSelectDropdown
            label="Todos"
            options={categorias.filter(c => c.value !== 'todos')}
            selected={categoriasSel}
            onToggle={(val) => toggleCategoria(val)}
          />
        </div>

        {/* Municipio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Municipio</label>
          <MultiSelectDropdown
            label="Todos"
            options={municipiosCaldas}
            selected={municipiosSel}
            onToggle={(val) => toggleMunicipio(val)}
            showSearch={true}
          />
        </div>

        {/* Precio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Precio (COP)</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              defaultValue={initialPrecioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
              placeholder="Min"
              className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-campo-400 focus:ring-2 focus:ring-campo-100 transition-all"
            />
            <span className="text-white/40 text-xs">—</span>
            <input
              type="number"
              defaultValue={initialPrecioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
              placeholder="Max"
              className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-campo-400 focus:ring-2 focus:ring-campo-100 transition-all"
            />
          </div>
        </div>

        {/* Raza */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Raza</label>
          <input
            type="text"
            defaultValue={initialRaza}
            onChange={(e) => setRaza(e.target.value.trim())}
            placeholder="Ej: Angus, Brangus..."
            className="w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-campo-400 focus:ring-2 focus:ring-campo-100 transition-all"
          />
        </div>

        {/* Sexo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Sexo</label>
          <MultiSelectDropdown
            label="Todos"
            options={sexoOptions}
            selected={sexosSel}
            onToggle={(val) => toggleSexo(val)}
          />
        </div>

        {/* Tipo de precio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Tipo de venta</label>
          <MultiSelectDropdown
            label="Todos"
            options={tipoPrecioOptions}
            selected={tipoPreciosSel}
            onToggle={(val) => toggleTipoPrecio(val)}
          />
        </div>

        {/* Fecha */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Publicación</label>
          <MultiSelectDropdown
            label="Todos"
            options={fechaPublicacionOptions}
            selected={fechasSel}
            onToggle={(val) => toggleFecha(val)}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Extras</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={destacados}
                onChange={(e) => setDestacados(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-campo-600 focus:ring-campo-500"
              />
              <span className="text-xs text-white/80 group-hover:text-white font-medium">Destacados</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={trazabilidad}
                onChange={(e) => setTrazabilidad(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-campo-600 focus:ring-campo-500"
              />
              <span className="text-xs text-white/80 group-hover:text-white font-medium">Trazabilidad</span>
            </label>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={applyFilters}
            className="px-4 py-1.5 bg-white text-campo-800 text-[11px] font-bold rounded-lg hover:bg-white/95 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            Aplicar filtros
          </button>
          {tieneFiltrosActivos && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-[11px] font-semibold text-white/80 bg-white/20 rounded-lg hover:bg-white/30 transition-all cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
