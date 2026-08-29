interface EmptyStateProps {
  filtrosActivos: boolean;
}

export default function EmptyState({ filtrosActivos }: EmptyStateProps) {
  const handleClear = () => {
    window.location.href = '/marketplace';
  };

  if (!filtrosActivos) return null;

  return (
    <div
      id="empty-state-animated"
      className="flex flex-col items-center justify-center py-12 px-4 max-w-md mx-auto text-center font-nunito"
    >
      {/* Contenedor del SVG Animado */}
      <div className="w-[180px] h-[180px] mb-6">
        <svg viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vaca animada masticando" className="w-full h-full">
          <title>Vaca masticando</title>
          <g stroke="#111111" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none">

            {/* orejas */}
            <ellipse cx="75" cy="165" rx="68" ry="32" transform="rotate(-8 75 165)"/>
            <ellipse cx="405" cy="165" rx="68" ry="32" transform="rotate(8 405 165)"/>

            {/* cuernos */}
            <path d="M188 92 C168 72,162 50,178 35 C182 55,192 72,205 85"/>
            <path d="M292 92 C312 72,318 50,302 35 C298 55,288 72,275 85"/>

            {/* cabeza */}
            <path d="M192 88
                     C168 88, 148 104, 142 132
                     L 138 195
                     C 135 235, 145 272, 168 300
                     C 190 324, 213 335, 240 335
                     C 267 335, 290 324, 312 300
                     C 335 272, 345 235, 342 195
                     L 338 132
                     C 332 104, 312 88, 288 88
                     Z"/>

            {/* ojos */}
            <ellipse cx="197" cy="197" rx="9" ry="12" fill="#111111" stroke="none"/>
            <ellipse cx="283" cy="197" rx="9" ry="12" fill="#111111" stroke="none"/>

            {/* hocico */}
            <path d="M175 258
                     C 175 244, 191 235, 211 235
                     L 269 235
                     C 289 235, 305 244, 305 258
                     L 305 301
                     C 305 321, 284 336, 259 336
                     L 221 336
                     C 196 336, 175 321, 175 301
                     Z"/>

            {/* fosas nasales */}
            <ellipse cx="212" cy="270" rx="15" ry="19"/>
            <ellipse cx="268" cy="270" rx="15" ry="19"/>

            {/* mandibula / boca animada */}
            <g id="mandibula">
              <path d="M212 305 C 222 316, 234 316, 240 308 C 246 316, 258 316, 268 305"/>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 0,6; 0,0"
                dur="0.9s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
            </g>
          </g>
        </svg>
      </div>

      <h3 className="text-2xl font-extrabold text-[#1B4332] mb-3">
        ¡Vaya! No encontramos lo que buscas
      </h3>
      <p className="text-base text-[#1B4332]/85 mb-6 leading-relaxed">
        Parece que ningún producto coincide con tus filtros actuales. No te preocupes, prueba ajustando los criterios de búsqueda o limpiando los filtros.
      </p>

      {/* Tips */}
      <div className="bg-stone-50/60 rounded-2xl p-5 border border-[#E8DCCB] text-left mb-6 w-full">
        <h4 className="text-sm font-bold text-[#D4A373] mb-3 uppercase tracking-wide">
          Tips de búsqueda:
        </h4>
        <ul className="space-y-2.5 text-sm text-[#1B4332]/90">
          <li className="flex items-start gap-2">
            <span className="text-[#52B788] mt-0.5">•</span>
            <span>Revisa que los filtros estén bien seleccionados</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#52B788] mt-0.5">•</span>
            <span>Prueba con términos más generales</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#52B788] mt-0.5">•</span>
            <span>Elimina algunos filtros para ampliar los resultados</span>
          </li>
        </ul>
      </div>

      {/* Botón */}
      <button
        onClick={handleClear}
        className="empty-state-btn inline-flex items-center justify-center px-6 py-3.5 bg-[#2D6A4F] text-white font-bold rounded-2xl shadow-md hover:bg-[#1B4332] active:scale-[0.98] transition-all duration-300 gap-2 cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Ver todos los productos
      </button>
    </div>
  );
}
