import { useState, useRef } from 'react';

const municipiosCaldas = [
  'Aguadas', 'Anserma', 'Aranzazu', 'Belalcázar', 'Chinchiná',
  'Filadelfia', 'La Dorada', 'La Merced', 'Manizales (capital)',
  'Manzanares', 'Marmato', 'Marquetalia', 'Marulanda', 'Neira',
  'Norcasia', 'Pácora', 'Palestina', 'Pensilvania', 'Riosucio',
  'Risaralda', 'Salamina', 'Samaná', 'San José', 'Supía',
  'Victoria', 'Villamaría', 'Viterbo',
];

export default function AgricolaForm() {
  const [nombre, setNombre] = useState('');
  const [unidadPeso, setUnidadPeso] = useState('Kg');
  const [peso, setPeso] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const total = photos.length + files.length;
    if (total > 5) {
      setError('Máximo 5 fotos permitidas');
      return;
    }
    setError('');
    const newPhotos = [...photos, ...files].slice(0, 5);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
  }

  function removePhoto(index: number) {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
  }

  function resetForm() {
    setNombre('');
    setUnidadPeso('Kg');
    setPeso('');
    setDescripcion('');
    setUbicacion('');
    setPhotos([]);
    setPhotoPreviews([]);
    setSuccess(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!nombre || nombre.trim().length < 3) {
      setError('El nombre es obligatorio y debe tener al menos 3 caracteres');
      setLoading(false);
      return;
    }

    if (!peso) {
      setError('El peso es obligatorio');
      setLoading(false);
      return;
    }

    if (!ubicacion) {
      setError('El municipio es obligatorio');
      setLoading(false);
      return;
    }

    let uploadedPhotoUrls: string[] = [];

    if (photos.length > 0) {
      try {
        const uploadFormData = new FormData();
        photos.forEach((photo) => uploadFormData.append('photos', photo));

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedPhotoUrls = uploadData.urls || [];
        }
      } catch (uploadErr) {
        console.log('Error uploading files:', uploadErr);
      }
    }

    const payload = {
      tipo: 'agricola',
      nombre: nombre.trim(),
      unidad_peso: unidadPeso,
      peso: parseFloat(peso),
      descripcion: descripcion.slice(0, 500),
      ubicacion,
      departamento: 'Caldas',
      imagenes: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : ['/images/categories/cultivos.webp'],
    };

    try {
      const token = localStorage.getItem('agroup_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/publicar', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        resetForm();
      } else {
        const errData = await res.json().catch(() => ({ error: 'Error al publicar' }));
        setError(errData.error || 'Error al publicar');
      }
    } catch (err) {
      setError('Error al publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 text-emerald-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-emerald-700 mb-2">Publicado con éxito</h3>
        <p className="text-sm text-slate-500 mb-6">Tu producto agrícola ha sido publicado.</p>
        <button
          type="button"
          onClick={resetForm}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Publicar otro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto *</label>
        <input
          type="text"
          required
          minLength={3}
          maxLength={120}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Café Caturra, Tomate Chonto, Plátano Hartón"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de peso *</label>
          <select
            required
            value={unidadPeso}
            onChange={(e) => setUnidadPeso(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Gr">Gramos (Gr)</option>
            <option value="Lb">Libras (Lb)</option>
            <option value="Kg">Kilogramos (Kg)</option>
            <option value="Tl">Toneladas (Tl)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Peso *</label>
          <input
            type="number"
            required
            min={0}
            step="0.01"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="Ej. 500"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-slate-700">Descripción</label>
          <span className="text-xs text-slate-400">{descripcion.length}/500</span>
        </div>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value.slice(0, 500))}
          placeholder="Describe el producto, variedad, calidad, etc."
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Municipio *</label>
          <select
            required
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Seleccionar Municipio</option>
            {municipiosCaldas.map((mun) => (
              <option key={mun} value={mun}>{mun}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
          <input
            type="text"
            value="Caldas"
            readOnly
            tabIndex={-1}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed select-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Fotos del producto <span className="text-slate-400 font-normal">(opcional, máximo 5)</span>
        </label>
        <div
          onClick={() => photoInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
        >
          <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-slate-500">Haz clic para seleccionar fotos</p>
          <p className="text-xs text-slate-400 mt-1">{photos.length}/5 fotos seleccionadas</p>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
        {photoPreviews.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {photoPreviews.map((preview, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                <img src={preview} alt="" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-all"
        style={{ backgroundColor: '#1b3928' }}
      >
        {loading ? 'Publicando...' : 'Publicar Producto'}
      </button>
    </form>
  );
}
