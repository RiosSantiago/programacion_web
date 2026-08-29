import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginForm({ onToggle, googleClientId }: { onToggle?: () => void; googleClientId?: string }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const getRedirectUrl = () => {
    if (typeof window === 'undefined') return '/dashboard';
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect') || '/dashboard';
  };

  const handleGoogleCredential = async (response: { credential?: string }) => {
    if (!response.credential) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión con Google');
      }

      if (data.token) {
        localStorage.setItem('agroup_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('agroup_user', JSON.stringify(data.user));
      }

      window.location.href = getRedirectUrl();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Botón oficial de Google Identity Services
  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return;

    let cancelled = false;

    const renderButton = () => {
      const el = googleBtnRef.current;
      if (!el || cancelled || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
        use_fedcm_for_prompt: true,
      });
      el.innerHTML = '';
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        locale: 'es',
        width: Math.min(400, el.parentElement?.clientWidth || 320),
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return () => { cancelled = true; };
    }

    let script = document.getElementById('google-gsi-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-gsi-script';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderButton);
    // Por si el script terminó de cargar entre el chequeo y el listener
    if ((script as any).readyState === 'complete' || window.google?.accounts?.id) renderButton();

    return () => {
      cancelled = true;
      script?.removeEventListener('load', renderButton);
    };
  }, [googleClientId]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      if (data.token) {
        localStorage.setItem('agroup_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('agroup_user', JSON.stringify(data.user));
      }

      window.location.href = getRedirectUrl();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2.5">
          <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Email Field */}
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
            placeholder="Ingresa tu correo"
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#0B5D3B] rounded-xl text-sm text-[#1F2937] placeholder:text-[#9CA3AF] transition-all duration-200
                       focus:outline-none focus:border-[#0B5D3B] focus:ring-[3px] focus:ring-[#0B5D3B]/10
                       hover:border-[#D1D5DB]"
          />
        </div>
      </div>

      {/* Password Field */}
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
            placeholder="Tu contraseña"
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

      {/* Forgot password */}
      <div className="flex justify-end -mt-1">
        <a href="/auth/recuperar-contrasena" className="text-xs text-[#1F2937] hover:text-[#0B5D3B] transition-colors">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {/* Submit Button */}
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
            Iniciando sesión...
          </span>
        ) : (
          'Iniciar Sesión'
        )}
      </button>

      {googleClientId && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-[#0B5D3B]"></div>
            <span className="text-[#1F2937] text-xs flex-shrink-0">o continúa con</span>
            <div className="flex-1 border-t border-[#0B5D3B]"></div>
          </div>

          {/* Google Button (oficial, Google Identity Services) */}
          <div className="w-full flex justify-center">
            <div ref={googleBtnRef} className="w-full flex justify-center" />
          </div>
        </>
      )}

      {/* Register text */}
      <p className="text-center text-sm text-[#1F2937] mt-1">
        ¿No tienes cuenta?{' '}
        <button type="button" onClick={onToggle} className="text-[#0B5D3B] font-semibold hover:text-[#0D6E45] transition-colors">
          Regístrate con correo
        </button>
      </p>
    </form>
  );
}
