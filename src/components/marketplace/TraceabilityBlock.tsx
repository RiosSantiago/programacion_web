interface GenealogiaData {
  padre?: string;
  padreRaza?: string;
  madre?: string;
  madreRaza?: string;
  abueloPaterno?: string;
  abuelaPaterna?: string;
  abueloMaterno?: string;
  abuelaMaterna?: string;
}

interface TrazabilidadData {
  pesoActual?: number;
  ultimaVacuna?: string;
  fechaNacimiento?: string;
  verificacion?: 'basico' | 'verificado' | 'ica';
  historialPeso?: { fecha: string; peso: number }[];
  vacunas?: { fecha: string; nombre: string; tipo: string }[];
  genealogia?: GenealogiaData;
  categoria?: string;
  ubicacion?: string;
  coordenadas?: { lat: number; lng: number };
  id?: number;
}

interface TraceabilityBlockProps {
  data?: TrazabilidadData;
  nombre?: string;
}

export default function TraceabilityBlock({
  data,
  nombre = 'Este animal'
}: TraceabilityBlockProps) {
  const verificacion = data?.verificacion || 'verificado';
  const categoria = data?.categoria || 'bovinos';
  const esBovinoOEquino = categoria === 'bovinos' || categoria === 'equinos';

  const historialPeso = data?.historialPeso || [
    { fecha: 'Ene 26', peso: 320 },
    { fecha: 'Feb 26', peso: 355 },
    { fecha: 'Mar 26', peso: 385 },
    { fecha: 'Abr 26', peso: 410 },
    { fecha: 'May 26', peso: data?.pesoActual || 445 },
  ];

  const vacunas = data?.vacunas || [
    { fecha: '2026-01-15', nombre: 'Aftosa', tipo: 'Obligatoria' },
    { fecha: '2026-02-20', nombre: 'Brucelosis', tipo: 'Obligatoria' },
    { fecha: '2026-03-10', nombre: 'Carbunco', tipo: 'Recomendada' },
  ];

  const genealogia = data?.genealogia;

  const badgeInfo = {
    basico: { label: 'Verificación Básica', class: 'bg-slate-100 text-slate-600', icon: '○' },
    verificado: { label: 'Historial Verificado', class: 'bg-campo-100 text-campo-700', icon: '✓' },
    ica: { label: 'Certificado ICA', class: 'bg-blue-100 text-blue-700', icon: '★' },
  };

  const badge = badgeInfo[verificacion];

  const pesoMaximo = Math.max(...historialPeso.map(p => p.peso));
  const pesoMinimo = Math.min(...historialPeso.map(p => p.peso));
  const gananciaTotal = pesoMaximo - pesoMinimo;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-gradient-to-r from-campo-50 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-campo-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-campo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 00-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Historial del Animal</h3>
            <p className="text-xs text-slate-500">Trazabilidad y control sanitario</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
          <span>{badge.icon}</span>
          {badge.label}
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-campo-600">{data?.pesoActual || 445} kg</p>
            <p className="text-xs text-slate-500 mt-1">Peso actual</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-slate-700">+{gananciaTotal} kg</p>
            <p className="text-xs text-slate-500 mt-1">Ganancia total</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-slate-700 capitalize">{vacunas[0].nombre}</p>
            <p className="text-xs text-slate-500 mt-1">Última vacuna</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">Historial de Peso</h4>
            <span className="text-xs text-slate-400">Últimos 5 meses</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-end gap-2 h-24">
              {historialPeso.map((p, i) => {
                const height = ((p.peso - pesoMinimo + 20) / (pesoMaximo - pesoMinimo + 40)) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-slate-600">{p.peso}kg</span>
                    <div
                      className="w-full bg-gradient-to-t from-campo-500 to-campo-400 rounded-t transition-all duration-300"
                      style={{ height: `${height}%`, minHeight: '8px' }}
                    />
                    <span className="text-[10px] text-slate-400">{p.fecha}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Historial Sanitario</h4>
          <div className="space-y-2">
            {vacunas.map((v, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 bg-campo-100 rounded-full flex items-center justify-center text-campo-600 text-xs font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{v.nombre}</p>
                  <p className="text-xs text-slate-500">{v.fecha}</p>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {v.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Genealogía - solo para bovinos y equinos */}
        {esBovinoOEquino && genealogia && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700">Genealogía</h4>
              <span className="text-xs text-slate-400">Línea parental</span>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              {/* Abuelos */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white rounded-lg p-2.5 text-center border border-amber-200">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Abuelo Paterno</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{genealogia.abueloPaterno || '—'}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center border border-amber-200">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Abuela Paterna</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{genealogia.abuelaPaterna || '—'}</p>
                </div>
              </div>
              {/* Padres */}
              <div className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-amber-300" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-campo-50 rounded-xl p-3 text-center border border-campo-200">
                    <div className="w-7 h-7 bg-campo-200 rounded-full flex items-center justify-center mx-auto mb-1">
                      <svg className="w-3.5 h-3.5 text-campo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{genealogia.padre || '—'}</p>
                    <p className="text-[10px] text-campo-600 font-medium">{genealogia.padreRaza || '—'}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">PADRE</p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-200">
                    <div className="w-7 h-7 bg-rose-200 rounded-full flex items-center justify-center mx-auto mb-1">
                      <svg className="w-3.5 h-3.5 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{genealogia.madre || '—'}</p>
                    <p className="text-[10px] text-rose-600 font-medium">{genealogia.madreRaza || '—'}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">MADRE</p>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 rounded-full">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{nombre}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Registrado el {new Date().toLocaleDateString('es-CO')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}