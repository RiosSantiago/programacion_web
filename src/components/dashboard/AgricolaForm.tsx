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
  const [transporte, setTransporte] = useState('propio');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Evaluador dinámico de campos obligatorios en modo Agrícola
  const getFieldErrors = () => {
    const errs: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length < 3) {
      errs.nombre = 'El nombre del producto es obligatorio (mínimo 3 caracteres).';
    }
    if (!unidadPeso) {
      errs.unidadPeso = 'La unidad de peso es obligatoria.';
    }
    if (!peso.trim() || isNaN(Number(peso)) || Number(peso) <= 0) {
      errs.peso = 'El peso es obligatorio y debe ser mayor a 0.';
    }
    if (!descripcion.trim()) {
      errs.descripcion = 'La descripción es obligatoria.';
    }
    if (!ubicacion) {
      errs.ubicacion = 'El municipio es obligatorio.';
    }
    if (!transporte) {
      errs.transporte = 'El método de transporte es obligatorio.';
    }
    if (photos.length === 0) {
      errs.photos = 'Debes adjuntar al menos 1 foto del producto.';
    }
    return errs;
  };

  const fieldErrors = attemptedSubmit ? getFieldErrors() : {};

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
    setTransporte('propio');
    setPhotos([]);
    setPhotoPreviews([]);
    setAttemptedSubmit(false);
    setError('');
    setSuccess(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError('');

    const newErrors = getFieldErrors();
    const fieldOrder = ['nombre', 'unidadPeso', 'peso', 'descripcion', 'ubicacion', 'transporte', 'photos'];
    const firstError = fieldOrder.find((k) => newErrors[k]);

    if (firstError) {
      setError('Por favor completa todos los campos obligatorios marcados con (*).');
      const el = document.getElementById(`agri-${firstError}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in el && typeof (el as any).focus === 'function') {
          (el as any).focus();
        }
      }
      return;
    }

    setLoading(true);

    let uploadedPhotoUrls: string[] = [];

    if (photos.length > 0) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('categoria', 'agricultura');
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
      categoria: 'agricultura',
      nombre: nombre.trim(),
      unidad_peso: unidadPeso,
      peso: parseFloat(peso),
      descripcion: descripcion.trim().slice(0, 500),
      ubicacion,
      departamento: 'Caldas',
      imagenes: uploadedPhotoUrls,
      transporte,
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
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Publicar otro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-lg text-sm text-red-800/90 font-medium">
          {error}
        </div>
      )}

      {/* Nombre del producto * */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del producto *</label>
        <input
          id="agri-nombre"
          type="text"
          maxLength={120}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Café Caturra, Tomate Chonto, Plátano Hartón"
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
            fieldErrors.nombre
              ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
              : 'border-slate-300 focus:ring-emerald-500'
          }`}
        />
        {fieldErrors.nombre && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.nombre}</p>}
      </div>

      {/* Unidad de peso * y Peso * */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de peso *</label>
          <select
            id="agri-unidadPeso"
            value={unidadPeso}
            onChange={(e) => setUnidadPeso(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.unidadPeso
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          >
            <option value="Gr">Gramos (Gr)</option>
            <option value="Lb">Libras (Lb)</option>
            <option value="Kg">Kilogramos (Kg)</option>
            <option value="Tl">Toneladas (Tl)</option>
          </select>
          {fieldErrors.unidadPeso && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.unidadPeso}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Peso *</label>
          <input
            id="agri-peso"
            type="number"
            min={0}
            step="0.01"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="Ej. 500"
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.peso
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {fieldErrors.peso && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.peso}</p>}
        </div>
      </div>

      {/* Descripción * */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-slate-700">
            Descripción * <span className="text-slate-400 font-normal">(máx. 500 caracteres)</span>
          </label>
          <span className="text-xs text-slate-400">{descripcion.length}/500</span>
        </div>
        <textarea
          id="agri-descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value.slice(0, 500))}
          placeholder="Describe el producto, variedad, calidad, etc."
          maxLength={500}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-none focus:outline-none focus:ring-2 ${
            fieldErrors.descripcion
              ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
              : 'border-slate-300 focus:ring-emerald-500'
          }`}
        />
        {fieldErrors.descripcion && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.descripcion}</p>}
      </div>

      {/* Municipio * y Departamento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Municipio *</label>
          <select
            id="agri-ubicacion"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.ubicacion
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          >
            <option value="">Seleccionar Municipio</option>
            {municipiosCaldas.map((mun) => (
              <option key={mun} value={mun}>{mun}</option>
            ))}
          </select>
          {fieldErrors.ubicacion && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.ubicacion}</p>}
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

      {/* Transporte * */}
      <div id="agri-transporte" tabIndex={-1}>
        <label className="block text-sm font-medium text-slate-700 mb-2">Transporte *</label>
        <div className={`flex flex-col sm:flex-row gap-3 p-1 rounded-2xl transition-colors ${fieldErrors.transporte ? 'border-2 border-red-300 bg-red-50/10' : ''}`}>
          <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
            transporte === 'agroup'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="transporte_agri"
              value="agroup"
              checked={transporte === 'agroup'}
              onChange={() => setTransporte('agroup')}
              className="accent-emerald-600"
            />
            <span className="text-sm font-semibold">Transporte por medio de AgroUp</span>
          </label>
          <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
            transporte === 'propio'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="transporte_agri"
              value="propio"
              checked={transporte === 'propio'}
              onChange={() => setTransporte('propio')}
              className="accent-emerald-600"
            />
            <span className="text-sm font-semibold">Transporte por medios propios</span>
          </label>
        </div>
        {fieldErrors.transporte && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.transporte}</p>}
      </div>

      {/* Fotos del producto * */}
      <div id="agri-photos" tabIndex={-1}>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Fotos del producto * <span className="text-slate-400 font-normal">(mínimo 1, máximo 5)</span>
        </label>
        <div
          onClick={() => photoInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            fieldErrors.photos
              ? 'border-red-300 bg-red-50/10'
              : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
          }`}
        >
          <svg className={`w-8 h-8 mx-auto mb-2 ${fieldErrors.photos ? 'text-red-300' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-slate-500">Haz clic para seleccionar fotos</p>
          <p className="text-xs text-slate-400 mt-1">{photos.length}/5 fotos seleccionadas</p>
        </div>
        {fieldErrors.photos && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.photos}</p>}
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
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-400 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
        className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-all shadow-md"
        style={{ backgroundColor: '#1b3928' }}
      >
        {loading ? 'Publicando...' : 'Publicar Producto'}
      </button>
    </form>
  );
}
