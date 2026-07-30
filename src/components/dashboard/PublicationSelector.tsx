import { useState } from 'react';
import PublicationForm from './PublicationForm';
import AgricolaForm from './AgricolaForm';

export default function PublicationSelector() {
  const [tab, setTab] = useState<'pecuario' | 'agricola'>('pecuario');

  return (
    <>
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('pecuario')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
            tab === 'pecuario'
              ? 'text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          style={tab === 'pecuario' ? { backgroundColor: '#1b3928' } : undefined}
        >
          Pecuario
        </button>
        <button
          type="button"
          onClick={() => setTab('agricola')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
            tab === 'agricola'
              ? 'text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          style={tab === 'agricola' ? { backgroundColor: '#1b3928' } : undefined}
        >
          Agrícola
        </button>
      </div>

      {tab === 'pecuario' ? <PublicationForm /> : <AgricolaForm />}
    </>
  );
}
