import { useState } from 'react';
import { login as storeLogin, setToken } from '../../stores/auth';

export default function RegistroForm({ onToggle }: { onToggle?: () => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    celular: '',
    password: '',
    confirmarPassword: '',
    aceptarTerminos: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!formData.aceptarTerminos) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          celular: formData.celular,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar');
      }

      storeLogin(data.user);
      if (data.token) {
        setToken(data.token);
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2.5">
          <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Nombre */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#374151]">Nombre completo</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <input
            type="text"
            required
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Juan Pérez"
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#0B5D3B] rounded-xl text-sm text-[#1F2937] placeholder:text-[#9CA3AF] transition-all duration-200
                       focus:outline-none focus:border-[#0B5D3B] focus:ring-[3px] focus:ring-[#0B5D3B]/10
                       hover:border-[#D1D5DB]"
          />
        </div>
      </div>

      {/* Email + Celular */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#374151]">Correo electrónico</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@correo.com"
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#0B5D3B] rounded-xl text-sm text-[#1F2937] placeholder:text-[#9CA3AF] transition-all duration-200
                         focus:outline-none focus:border-[#0B5D3B] focus:ring-[3px] focus:ring-[#0B5D3B]/10
                         hover:border-[#D1D5DB]"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[#374151]">Celular</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <input
              type="tel"
              required
              value={formData.celular}
              onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
              placeholder="3001234567"
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#0B5D3B] rounded-xl text-sm text-[#1F2937] placeholder:text-[#9CA3AF] transition-all duration-200
                         focus:outline-none focus:border-[#0B5D3B] focus:ring-[3px] focus:ring-[#0B5D3B]/10
                         hover:border-[#D1D5DB]"
            />
          </div>
        </div>
      </div>

      {/* Contraseña */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#374151]">Contraseña</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            className="w-full pl-11 pr-12 py-3 bg-white border-2 border-[#0B5D3B] rounded-xl text-sm text-[#1F2937] placeholder:text-[#9CA3AF] transition-all duration-200
                       focus:outline-none focus:border-[#0B5D3B] focus:ring-[3px] focus:ring-[#0B5D3B]/10
                       hover:border-[#D1D5DB]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors p-1"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Confirmar contraseña */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#374151]">Confirmar contraseña</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <input
            type="password"
            required
            value={formData.confirmarPassword}
            onChange={(e) => setFormData({ ...formData, confirmarPassword: e.target.value })}
            placeholder="Repite la contraseña"
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#0B5D3B] rounded-xl text-sm text-[#1F2937] placeholder:text-[#9CA3AF] transition-all duration-200
                       focus:outline-none focus:border-[#0B5D3B] focus:ring-[3px] focus:ring-[#0B5D3B]/10
                       hover:border-[#D1D5DB]"
          />
        </div>
      </div>

      {/* Términos */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.aceptarTerminos}
            onChange={(e) => setFormData({ ...formData, aceptarTerminos: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded border-[#D1D5DB] text-[#0B5D3B] focus:ring-[#0B5D3B] focus:ring-offset-0"
          />
          <span className="text-sm text-[#1F2937]">
            Acepto los{' '}
            <a href="/terminos" className="text-[#0B5D3B] font-medium hover:text-[#0D6E45] transition-colors">Términos y Condiciones</a>
            {' '}y la{' '}
            <a href="/privacidad" className="text-[#0B5D3B] font-medium hover:text-[#0D6E45] transition-colors">Política de Privacidad</a>
          </span>
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-[#0B5D3B] text-white font-semibold rounded-xl transition-all duration-200
                   hover:bg-[#0D6E45] active:scale-[0.98]
                   disabled:bg-[#6B8F7A] disabled:active:scale-100
                   shadow-md shadow-[#0B5D3B]/20 hover:shadow-lg hover:shadow-[#0B5D3B]/30
                   text-sm tracking-wide"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2.5">
            <svg className="animate-spin w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creando cuenta...
          </span>
        ) : (
          'Crear Cuenta'
        )}
      </button>

      {/* Login link */}
      <p className="text-center text-sm text-[#1F2937]">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onToggle} className="text-[#0B5D3B] font-semibold hover:text-[#0D6E45] transition-colors">
          Inicia sesión
        </button>
      </p>
    </form>
  );
}