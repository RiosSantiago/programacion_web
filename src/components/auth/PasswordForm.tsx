import { useState } from 'react';
import { $user } from '../../stores/auth';

export default function PasswordForm() {
  const currentUser = $user.get();

  const [formData, setFormData] = useState({
    passwordActual: '',
    password: '',
    confirmarPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.passwordActual) {
      setError('Debes ingresar tu contraseña actual');
      return;
    }
    if (!formData.password) {
      setError('Debes ingresar una nueva contraseña');
      return;
    }
    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (formData.password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('agroup_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      const res = await fetch('/api/auth/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: currentUser?.nombre || '',
          email: currentUser?.email || '',
          celular: currentUser?.celular || '',
          passwordActual: formData.passwordActual,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      setFormData({ passwordActual: '', password: '', confirmarPassword: '' });
      setSuccess('Contraseña actualizada correctamente');
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

      <p className="text-xs text-[#6B6B6B]">Debes ingresar tu contraseña actual para poder cambiarla.</p>

      <div>
        <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Contraseña actual</label>
        <input
          type="password"
          value={formData.passwordActual}
          onChange={(e) => setFormData({ ...formData, passwordActual: e.target.value })}
          placeholder="Ingresa tu contraseña actual"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Nueva contraseña</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2D2D2D] mb-1.5">Confirmar nueva contraseña</label>
          <input
            type="password"
            value={formData.confirmarPassword}
            onChange={(e) => setFormData({ ...formData, confirmarPassword: e.target.value })}
            placeholder="Repite la nueva contraseña"
            className={inputClass}
          />
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
              Actualizando...
            </span>
          ) : (
            'Actualizar contraseña'
          )}
        </button>
        <div className="text-center mt-4">
          <a href="/auth/recuperar-contrasena" className="text-sm text-gold-700 hover:text-gold-800 hover:underline transition-colors">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </form>
  );
}
