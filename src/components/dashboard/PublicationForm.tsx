import { useState, useRef } from 'react';

const categoriasDemo = [
  { value: 'bovino', label: 'Bovinos' },
  { value: 'equino', label: 'Equinos' },
  { value: 'porcino', label: 'Porcinos' },
  { value: 'ovino', label: 'Ovinos' },
  { value: 'avicola', label: 'Avicolas' },
];

function getPlaceholderImagen(categoria: string): string {
  const imagenes: Record<string, string> = {
    bovino: '/images/ganado.svg',
    equino: '/images/caballo.svg',
    porcino: '/images/cerdo.svg',
    ovino: '/images/ganado.svg',
    avicola: '/images/gallina.svg',
  };
  return imagenes[categoria] || '/images/ganado.svg';
}

export default function PublicationForm() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

  const [formData, setFormData] = useState({
    nombre: params.get('animal') || '',
    categoria: 'bovino',
    raza: params.get('raza') || '',
    peso: params.get('peso') || '',
    precio: '',
    tipoPrecio: 'fijo',
    stock: '1',
    salud: 'Bueno',
    sexo: '',
    ubicacion: '',
    departamento: 'Caldas',
    descripcion: '',
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  }

  function removeVideo() {
    setVideo(null);
    setVideoPreview('');
    if (videoInputRef.current) videoInputRef.current.value = '';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let uploadedPhotoUrls: string[] = [];
    let uploadedVideoUrl = '';

    if (photos.length > 0 || video) {
      try {
        const uploadFormData = new FormData();
        photos.forEach((photo) => uploadFormData.append('photos', photo));
        if (video) uploadFormData.append('video', video);

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedPhotoUrls = uploadData.urls || [];
          uploadedVideoUrl = uploadData.videoUrl || '';
        }
      } catch (uploadErr) {
        console.log('Error uploading files:', uploadErr);
      }
    }

    const payload = {
      nombre: formData.nombre,
      categoria: formData.categoria,
      raza: formData.raza,
      peso: formData.peso,
      precio: formData.precio,
      tipoPrecio: formData.tipoPrecio,
      stock: formData.stock,
      salud: formData.salud,
      sexo: formData.sexo,
      ubicacion: formData.ubicacion,
      departamento: formData.departamento,
      descripcion: formData.descripcion,
      imagenes: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : [getPlaceholderImagen(formData.categoria)],
      video: uploadedVideoUrl,
    };

    try {
      let apiSuccess = false;
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
          const text = await res.text();
          const result = JSON.parse(text || '{}');
          if (result.success) {
            apiSuccess = true;
          }
        }
      } catch (apiError) {
        console.log('API falló, usando localStorage');
      }

      if (!apiSuccess) {
        const productos = JSON.parse(localStorage.getItem('agroup_productos') || '[]');
        const nuevoProducto = {
          ...payload,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          estado: 'disponible',
          vendedor: 'Mi Hacienda',
          vendedor_rating: 4.5,
          envio: 1,
          destacado: 0,
          oferta: 0,
          trazabilidad: 0,
        };

        const historialPrecios = JSON.parse(localStorage.getItem('agroup_precios_historial') || '[]');
        historialPrecios.push({
          productoId: nuevoProducto.id,
          precio: parseFloat(formData.precio),
          tipo: formData.tipoPrecio,
          fecha: new Date().toISOString(),
          motivo: 'Publicacion inicial',
        });
        localStorage.setItem('agroup_precios_historial', JSON.stringify(historialPrecios));

        productos.push(nuevoProducto);
        localStorage.setItem('agroup_productos', JSON.stringify(productos));
      }

      setSuccess(true);
    } catch (err) {
      setError('Error al publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  function resetForm() {
    setFormData({
      nombre: '',
      categoria: 'bovino',
      raza: '',
      peso: '',
      precio: '',
      tipoPrecio: 'fijo',
      stock: '1',
      salud: 'Bueno',
      sexo: '',
      ubicacion: '',
      departamento: 'Caldas',
      descripcion: '',
    });
    setPhotos([]);
    setPhotoPreviews([]);
    setVideo(null);
    setVideoPreview('');
    setSuccess(false);
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-bold text-emerald-800">Publicación creada exitosamente</p>
          <p className="text-emerald-600 mt-1">Tu animal ya está disponible en el marketplace.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Seguir Publicando
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del animal/lote *</label>
        <input
          type="text"
          required
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Lote de 15 Novillos Angus"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
          <select
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            {categoriasDemo.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Raza</label>
          <input
            type="text"
            value={formData.raza}
            onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
            placeholder="Angus Negro"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
          <input
            type="number"
            value={formData.peso}
            onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
            placeholder="420"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sexo</label>
          <select
            value={formData.sexo}
            onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Seleccionar</option>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
            <option value="mixto">Mixto</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad *</label>
          <input
            type="number"
            required
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="1"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Municipio</label>
          <input
            type="text"
            required
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
            placeholder="Manizales, Caldas"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
          <select
            value={formData.departamento}
            onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Amazonas">Amazonas</option>
            <option value="Antioquia">Antioquia</option>
            <option value="Arauca">Arauca</option>
            <option value="Atlantico">Atlantico</option>
            <option value="Bolivar">Bolivar</option>
            <option value="Boyaca">Boyaca</option>
            <option value="Caldas">Caldas</option>
            <option value="Caqueta">Caqueta</option>
            <option value="Casanare">Casanare</option>
            <option value="Cauca">Cauca</option>
            <option value="Cesar">Cesar</option>
            <option value="Choco">Choco</option>
            <option value="Cordoba">Cordoba</option>
            <option value="Cundinamarca">Cundinamarca</option>
            <option value="Guainia">Guainia</option>
            <option value="Guaviare">Guaviare</option>
            <option value="Huila">Huila</option>
            <option value="La Guajira">La Guajira</option>
            <option value="Magdalena">Magdalena</option>
            <option value="Meta">Meta</option>
            <option value="Narino">Narino</option>
            <option value="Norte de Santander">Norte de Santander</option>
            <option value="Putumayo">Putumayo</option>
            <option value="Quindio">Quindio</option>
            <option value="Risaralda">Risaralda</option>
            <option value="San Andres">San Andres</option>
            <option value="Santander">Santander</option>
            <option value="Sucre">Sucre</option>
            <option value="Tolima">Tolima</option>
            <option value="Valle del Cauca">Valle del Cauca</option>
            <option value="Vaupes">Vaupes</option>
            <option value="Vichada">Vichada</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Precio</label>
        <div className="flex gap-3">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Precio total (COP) *</label>
          <input
            type="number"
            required
            value={formData.precio}
            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
            placeholder="4200000"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
          {formData.tipoPrecio === 'negociable' && (
            <p className="text-xs text-amber-600 mt-1">Los compradores podrán hacer ofertas por WhatsApp</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado de salud</label>
          <select
            value={formData.salud}
            onChange={(e) => setFormData({ ...formData, salud: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="Bueno">Bueno</option>
            <option value="Regular">Regular</option>
            <option value="Excelente">Excelente</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Descripción <span className="text-slate-400 font-normal">(máx. 500 caracteres)</span>
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value.slice(0, 500) })}
          placeholder="Describe brevemente el animal o lote..."
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
        />
        <p className="text-xs text-slate-400 text-right mt-1">{formData.descripcion.length}/500</p>
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Fotos del animal <span className="text-slate-400 font-normal">(opcional, máximo 5)</span>
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

      {/* Video */}
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
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600 transition-colors"
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
      >
        {loading ? 'Publicando...' : 'Publicar Animal'}
      </button>
    </form>
  );
}
