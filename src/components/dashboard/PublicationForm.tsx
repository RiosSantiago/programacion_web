import { useState, useRef, useEffect } from 'react';

const municipiosCaldas = [
  'Aguadas',
  'Anserma',
  'Aranzazu',
  'Belalcázar',
  'Chinchiná',
  'Filadelfia',
  'La Dorada',
  'La Merced',
  'Manizales (capital)',
  'Manzanares',
  'Marmato',
  'Marquetalia',
  'Marulanda',
  'Neira',
  'Norcasia',
  'Pácora',
  'Palestina',
  'Pensilvania',
  'Riosucio',
  'Risaralda',
  'Salamina',
  'Samaná',
  'San José',
  'Supía',
  'Victoria',
  'Villamaría',
  'Viterbo',
];

interface CatOption { value: string; label: string }

export default function PublicationForm() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [categorias, setCategorias] = useState<CatOption[]>([]);

  useEffect(() => {
    fetch('/api/categorias')
      .then(r => r.json())
      .then(data => {
        if (data.categorias?.length) {
          setCategorias(data.categorias.map((c: any) => ({ value: c.slug, label: c.nombre })));
        }
      })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    nombre: params.get('animal') || '',
    categoria: params.get('categoria') || '',
    raza: params.get('raza') || '',
    peso: params.get('peso') || '',
    precio: '',
    tipoPrecio: 'fijo',
    stock: '1',
    salud: 'Bueno',
    sexo: '',
    ubicacion: '',
    departamento: 'Caldas',
    finca: '',
    vereda: '',
    referencia_ubicacion: '',
    descripcion: '',
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [certificaciones, setCertificaciones] = useState<File[]>([]);
  const [transporte, setTransporte] = useState('propio');
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [certPreviews, setCertPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // Re-evaluación dinámica de campos obligatorios
  const getFieldErrors = () => {
    const errs: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      errs.nombre = 'El nombre del animal/lote es obligatorio.';
    }
    if (!formData.categoria) {
      errs.categoria = 'La categoría es obligatoria.';
    }
    if (!formData.raza.trim()) {
      errs.raza = 'La raza es obligatoria.';
    }
    if (!formData.peso.trim() || isNaN(Number(formData.peso)) || Number(formData.peso) <= 0) {
      errs.peso = 'El peso (kg) es obligatorio y debe ser mayor a 0.';
    }
    if (!formData.sexo) {
      errs.sexo = 'El sexo es obligatorio.';
    }
    if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) <= 0) {
      errs.stock = 'La cantidad es obligatoria y debe ser mayor a 0.';
    }
    if (!formData.ubicacion) {
      errs.ubicacion = 'El municipio es obligatorio.';
    }
    if (!formData.finca.trim() || formData.finca.trim().length < 3 || formData.finca.trim().length > 80) {
      errs.finca = 'El nombre de la finca es obligatorio (entre 3 y 80 caracteres).';
    }
    if (!formData.tipoPrecio) {
      errs.tipoPrecio = 'El tipo de precio es obligatorio.';
    }
    if (!formData.precio.trim() || isNaN(Number(formData.precio)) || Number(formData.precio) <= 0) {
      errs.precio = 'El precio total es obligatorio y debe ser mayor a 0.';
    }
    if (!formData.salud) {
      errs.salud = 'El estado de salud es obligatorio.';
    }
    if (!transporte) {
      errs.transporte = 'El método de transporte es obligatorio.';
    }
    if (!formData.descripcion.trim()) {
      errs.descripcion = 'La descripción es obligatoria.';
    }
    if (photos.length === 0) {
      errs.photos = 'Debes adjuntar al menos 1 foto del animal.';
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

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError('El video no debe superar 50MB');
      return;
    }
    setError('');
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function removeVideo() {
    setVideo(null);
    setVideoPreview('');
  }

  function handleCertSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const total = certificaciones.length + files.length;
    if (total > 5) {
      setError('Máximo 5 certificaciones permitidas');
      return;
    }
    setError('');
    const newCerts = [...certificaciones, ...files].slice(0, 5);
    setCertificaciones(newCerts);
    setCertPreviews(newCerts.map((f) => f.name));
  }

  function removeCert(index: number) {
    const newCerts = certificaciones.filter((_, i) => i !== index);
    setCertificaciones(newCerts);
    setCertPreviews(newCerts.map((f) => f.name));
  }

  function resetForm() {
    setFormData({
      nombre: '',
      categoria: '',
      raza: '',
      peso: '',
      precio: '',
      tipoPrecio: 'fijo',
      stock: '1',
      salud: 'Bueno',
      sexo: '',
      ubicacion: '',
      departamento: 'Caldas',
      finca: '',
      vereda: '',
      referencia_ubicacion: '',
      descripcion: '',
    });
    setPhotos([]);
    setVideo(null);
    setCertificaciones([]);
    setTransporte('propio');
    setPhotoPreviews([]);
    setVideoPreview('');
    setCertPreviews([]);
    setSuccess(false);
    setError('');
    setAttemptedSubmit(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError('');

    const newErrors = getFieldErrors();
    const fieldOrder = [
      'nombre',
      'categoria',
      'raza',
      'peso',
      'sexo',
      'stock',
      'ubicacion',
      'finca',
      'tipoPrecio',
      'precio',
      'salud',
      'transporte',
      'descripcion',
      'photos',
    ];
    const firstError = fieldOrder.find((k) => newErrors[k]);

    if (firstError) {
      setError('Por favor completa todos los campos obligatorios marcados con (*).');
      const el = document.getElementById(`field-${firstError}`);
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
    let uploadedVideoUrl = '';
    let uploadedCertUrls: string[] = [];

    if (photos.length > 0 || video || certificaciones.length > 0) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('categoria', formData.categoria || 'animales');
        photos.forEach((photo) => uploadFormData.append('photos', photo));
        if (video) uploadFormData.append('video', video);
        certificaciones.forEach((cert) => uploadFormData.append('certificaciones', cert));

        const token =
          localStorage?.getItem?.('agroup_token') ||
          window?.localStorage?.getItem('agroup_token');

        console.log('[AUTH DEBUG] Token type:', typeof token);
        console.log('[AUTH DEBUG] Token length:', token?.length);
        console.log('[AUTH DEBUG] Token value (first 50 chars):', token?.substring(0, 50));
        console.log('[AUTH DEBUG] Token is empty string?', token === '');
        console.log('[AUTH DEBUG] Token is null?', token === null);
        console.log('[AUTH DEBUG] Token is undefined?', token === undefined);

        if (!token) {
          console.error('[AUTH DEBUG] Token NOT FOUND en localStorage');
          console.error('[AUTH DEBUG] All localStorage keys:', Object.keys(localStorage || {}));
          setError('Error de autenticación: token perdido');
          setLoading(false);
          return;
        }

        // Agregar el token AL FormData, no a los headers
        uploadFormData.append('authorization', `Bearer ${token}`);

        console.log('[AUTH DEBUG] Proceeding with token in FormData, about to fetch');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        console.log('[AUTH DEBUG] Fetch done, status:', uploadRes.status);

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json().catch(() => ({}));
          setError(uploadError.error || 'Error al subir archivo. Verifica el formato y el tamaño.');
          setLoading(false);
          return; // no continúes con el resto del formulario
        }

        const uploadData = await uploadRes.json();
        uploadedPhotoUrls = uploadData.urls || [];
        uploadedVideoUrl = uploadData.videoUrl || '';
        uploadedCertUrls = uploadData.certUrls || [];
      } catch (uploadErr) {
        console.log('Error uploading files:', uploadErr);
        setError('Error al subir archivo. Intenta de nuevo.');
      }
    }

    const payload = {
      ...formData,
      peso: parseFloat(formData.peso),
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      imagenes: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : ['/images/ganado.svg'],
      video: uploadedVideoUrl,
      certificaciones: uploadedCertUrls,
      transporte,
    };

    try {
      const token = localStorage.getItem('agroup_token');
      console.log('[AUTH DEBUG] publicar token:', token ? 'presente' : 'NULL');
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
        <p className="text-sm text-slate-500 mb-6">Tu producto ha sido publicado y está disponible en el marketplace.</p>
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
        <div className="p-3.5 bg-red-50/70 border border-red-200/80 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800/90 font-medium">{error}</p>
        </div>
      )}

      {/* Nombre del animal/lote * */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del animal/lote *</label>
        <input
          id="field-nombre"
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Lote de 15 Novillos Angus"
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
            fieldErrors.nombre
              ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
              : 'border-slate-300 focus:ring-emerald-500'
          }`}
        />
        {fieldErrors.nombre && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.nombre}</p>}
      </div>

      {/* Categoría * y Raza * */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
          <select
            id="field-categoria"
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.categoria
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          >
            <option value="">Seleccionar Categoría</option>
            {categorias.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {fieldErrors.categoria && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.categoria}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Raza *</label>
          <input
            id="field-raza"
            type="text"
            value={formData.raza}
            onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
            placeholder="Angus Negro"
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.raza
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {fieldErrors.raza && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.raza}</p>}
        </div>
      </div>

      {/* Peso (kg) *, Sexo *, Cantidad * */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg) *</label>
          <input
            id="field-peso"
            type="number"
            value={formData.peso}
            onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
            placeholder="420"
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.peso
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {fieldErrors.peso && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.peso}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sexo *</label>
          <select
            id="field-sexo"
            value={formData.sexo}
            onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.sexo
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          >
            <option value="">Seleccionar</option>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
            <option value="mixto">Mixto</option>
          </select>
          {fieldErrors.sexo && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.sexo}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
          <input
            id="field-stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="1"
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.stock
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {fieldErrors.stock && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.stock}</p>}
        </div>
      </div>

      {/* Municipio * y Departamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Municipio *</label>
          <select
            id="field-ubicacion"
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.ubicacion
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          >
            <option value="">Seleccionar Municipio</option>
            {municipiosCaldas.map((mun) => (
              <option key={mun} value={mun}>
                {mun}
              </option>
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

      {/* Finca * y Vereda (opcional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la finca *</label>
          <input
            id="field-finca"
            type="text"
            minLength={3}
            maxLength={80}
            value={formData.finca}
            onChange={(e) => setFormData({ ...formData, finca: e.target.value })}
            placeholder="Ej. Hacienda El Paraíso"
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.finca
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {fieldErrors.finca && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.finca}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Vereda / Corregimiento <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            maxLength={80}
            value={formData.vereda}
            onChange={(e) => setFormData({ ...formData, vereda: e.target.value })}
            placeholder="Ej. Vereda La Esperanza"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Sector o referencia (opcional) */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-slate-700">
            Sector o referencia <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <span className="text-xs text-slate-400">{formData.referencia_ubicacion.length}/200</span>
        </div>
        <textarea
          maxLength={200}
          rows={2}
          value={formData.referencia_ubicacion}
          onChange={(e) => setFormData({ ...formData, referencia_ubicacion: e.target.value })}
          placeholder="Ej. A 2 km del parque principal, vía al corregimiento de San José."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>

      {/* Tipo de Precio * */}
      <div id="field-tipoPrecio" tabIndex={-1}>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Precio *</label>
        <div className={`flex flex-col sm:flex-row gap-3 p-1 rounded-2xl transition-colors ${fieldErrors.tipoPrecio ? 'border-2 border-red-300 bg-red-50/10' : ''}`}>
          <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
            formData.tipoPrecio === 'fijo'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="tipoPrecio"
              value="fijo"
              checked={formData.tipoPrecio === 'fijo'}
              onChange={() => setFormData({ ...formData, tipoPrecio: 'fijo' })}
              className="sr-only"
            />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">Precio Fijo</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
            formData.tipoPrecio === 'negociable'
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="tipoPrecio"
              value="negociable"
              checked={formData.tipoPrecio === 'negociable'}
              onChange={() => setFormData({ ...formData, tipoPrecio: 'negociable' })}
              className="sr-only"
            />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <span className="text-sm font-semibold">Precio Negociable</span>
          </label>
        </div>
        {fieldErrors.tipoPrecio && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.tipoPrecio}</p>}
      </div>

      {/* Precio total (COP) * y Estado de salud * */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Precio total (COP) *</label>
          <input
            id="field-precio"
            type="number"
            value={formData.precio}
            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
            placeholder="4200000"
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.precio
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          />
          {formData.tipoPrecio === 'negociable' && (
            <p className="text-xs text-amber-600 mt-1">Los compradores podrán hacer ofertas por WhatsApp</p>
          )}
          {parseInt(formData.stock) > 1 && parseFloat(formData.precio) > 0 && (
            <div className="mt-2.5 p-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-sm animate-fadeIn">
              <span className="font-semibold flex items-center gap-1.5 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                Precio unitario por animal:
              </span>
              <span className="font-bold text-sm text-emerald-900">
                ${Math.round(parseFloat(formData.precio) / parseInt(formData.stock)).toLocaleString('es-CO')} COP
              </span>
            </div>
          )}
          {fieldErrors.precio && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.precio}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado de salud *</label>
          <select
            id="field-salud"
            value={formData.salud}
            onChange={(e) => setFormData({ ...formData, salud: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
              fieldErrors.salud
                ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
                : 'border-slate-300 focus:ring-emerald-500'
            }`}
          >
            <option value="">Seleccionar</option>
            <option value="Bueno">Bueno</option>
            <option value="Regular">Regular</option>
            <option value="Excelente">Excelente</option>
          </select>
          {fieldErrors.salud && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.salud}</p>}
        </div>
      </div>

      {/* Transporte * */}
      <div id="field-transporte" tabIndex={-1}>
        <label className="block text-sm font-medium text-slate-700 mb-2">Transporte *</label>
        <div className={`flex flex-col sm:flex-row gap-3 p-1 rounded-2xl transition-colors ${fieldErrors.transporte ? 'border-2 border-red-300 bg-red-50/10' : ''}`}>
          <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
            transporte === 'agroup'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}>
            <input
              type="radio"
              name="transporte"
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
              name="transporte"
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

      {/* Descripción * */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Descripción * <span className="text-slate-400 font-normal">(máx. 500 caracteres)</span>
        </label>
        <textarea
          id="field-descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value.slice(0, 500) })}
          placeholder="Describe brevemente el animal o lote..."
          maxLength={500}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-none focus:outline-none focus:ring-2 ${
            fieldErrors.descripcion
              ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-200'
              : 'border-slate-300 focus:ring-emerald-500'
          }`}
        />
        <p className="text-xs text-slate-400 text-right mt-1">{formData.descripcion.length}/500</p>
        {fieldErrors.descripcion && <p className="text-xs text-red-700/80 mt-1 font-medium">{fieldErrors.descripcion}</p>}
      </div>

      {/* Fotos del animal * */}
      <div id="field-photos" tabIndex={-1}>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Fotos del animal * <span className="text-slate-400 font-normal">(mínimo 1, máximo 5)</span>
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
                  className="absolute top-0.5 right-0.5 w-6 h-6 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video (opcional) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Video del animal <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        {!video ? (
          <div
            onClick={() => videoInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
          >
            <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-slate-500">Haz clic para seleccionar un video</p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-200">
            <video src={videoPreview} controls className="w-full max-h-48 object-cover" />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 w-7 h-7 bg-red-400 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              ×
            </button>
          </div>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
          className="hidden"
        />
      </div>

      {/* Certificaciones (opcional) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Certificaciones (ICA, RUV, RFG y Registro genealógico) <span className="text-slate-400 font-normal">(opcional, máx. 5)</span>
        </label>
        {certificaciones.length < 5 && (
          <div
            onClick={() => certInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
          >
            <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-500">Haz clic para subir certificados (PDF)</p>
            <p className="text-xs text-slate-400 mt-1">{certificaciones.length}/5 certificados seleccionados</p>
          </div>
        )}
        <input
          ref={certInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleCertSelect}
          className="hidden"
        />
        {certPreviews.length > 0 && (
          <div className="space-y-2 mt-2">
            {certPreviews.map((name, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-700 truncate">{name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCert(i)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold ml-2 shrink-0"
                >
                  Eliminar
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
