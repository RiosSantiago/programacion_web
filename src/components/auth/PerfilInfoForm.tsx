import { useState, useEffect } from 'react';
import { $user, updateUser, setToken } from '../../stores/auth';

export default function PerfilInfoForm() {
  const currentUser = $user.get();

  const [formData, setFormData] = useState({
    nombre: currentUser?.nombre || '',
    email: currentUser?.email || '',
    celular: currentUser?.celular || '',
    hacienda: currentUser?.hacienda || '',
    ciudad: currentUser?.ciudad || '',
    direccion: currentUser?.direccion || '',
    municipio: currentUser?.municipio || '',
    corregimiento: currentUser?.corregimiento || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      window.location.href = '/auth/login';
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin w-8 h-8 text-gold-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('agroup_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const body: Record<string, string> = {
        nombre: formData.nombre,
        email: formData.email,
        celular: formData.celular,
        hacienda: formData.hacienda,
        ciudad: formData.ciudad,
        direccion: formData.direccion,
        municipio: formData.municipio,
        corregimiento: formData.corregimiento,
      };

      const res = await fetch('/api/auth/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      updateUser(data.user);
      if (data.token) {
        setToken(data.token);
      }
      setSuccess('Información actualizada correctamente');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-[#E8E0D8] rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all bg-[#FFFDF7]';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Nombre completo</label>
        <input
          type="text"
          required
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Correo electrónico</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Celular</label>
          <input
            type="tel"
            required
            value={formData.celular}
            onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="border-t border-[#E8E0D8] pt-5">
        <h3 className="text-sm font-semibold text-[#2D2D2D] mb-4">Información de la hacienda / finca</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Nombre de hacienda o finca</label>
            <input
              type="text"
              value={formData.hacienda}
              onChange={(e) => setFormData({ ...formData, hacienda: e.target.value })}
              placeholder="Ej: Finca La Pradera"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Ciudad</label>
            <input
              type="text"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              placeholder="Ej: Manizales"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Ej: Km 5 vía al Magdalena"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Municipio</label>
            <input
              type="text"
              value={formData.municipio}
              onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              placeholder="Ej: Neira"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Corregimiento o vereda</label>
            <input
              type="text"
              value={formData.corregimiento}
              onChange={(e) => setFormData({ ...formData, corregimiento: e.target.value })}
              placeholder="Ej: Corregimiento de Argentina"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1b3928] text-white font-semibold rounded-xl hover:bg-[#152e1f] disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </span>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>
    </form>
  );
}
