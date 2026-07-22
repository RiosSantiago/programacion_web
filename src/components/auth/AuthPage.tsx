import { useState } from 'react';
import LoginForm from './LoginForm';
import RegistroForm from './RegistroForm';

export default function AuthPage({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const [mode, setMode] = useState(initialMode);
  const [animating, setAnimating] = useState(false);
  const isLogin = mode === 'login';

  const handleToggle = () => {
    setAnimating(true);
    setTimeout(() => {
      setMode(mode === 'login' ? 'register' : 'login');
    }, 50);
    setTimeout(() => {
      setAnimating(false);
    }, 750);
  };

  return (
    <>
      <div class="fixed inset-0 -z-10 bg-[#0B5D3B]">
        <img 
          src={isLogin ? "/images/imagen2.webp" : "/images/bg-mountains.webp"} 
          alt="" 
          class="absolute inset-0 w-full h-full object-cover" 
        />
        <div class={`absolute inset-0 ${isLogin ? 'bg-black/30' : 'bg-black/20'}`}></div>
      </div>

      <div class="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div
          class="w-full max-w-[880px] min-h-[520px] rounded-[24px] overflow-hidden animate-card-rise"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.30), 0 8px 24px -8px rgba(0,0,0,0.12)' }}
        >
          <div
            class="flex transition-transform duration-700"
            style={{ 
              width: '200%', 
              transform: isLogin ? 'translateX(0)' : 'translateX(-50%)', 
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          >
            {/* Slide 1: Login mode */}
            <div class="flex" style={{ width: '50%' }}>
              <div class="w-[45%] bg-white/25 backdrop-blur-sm flex flex-col items-center justify-center px-10 py-10 relative">
                <div class="text-center mb-5">
                  <h1 class="text-[26px] font-semibold text-[#1F2937] tracking-tight" style={{ fontFamily: "'Inter', 'Manrope', system-ui, sans-serif" }}>Iniciar Sesión</h1>
                  <p class="text-[#1F2937] text-sm mt-1.5">Conéctate con tu tierra, protege tu futuro</p>
                </div>
                <div class="w-full max-w-[340px]">
                  <LoginForm onToggle={handleToggle} />
                </div>
                <a href="/" class="mt-4 inline-flex items-center gap-1.5 text-xs text-[#0B5D3B] hover:text-[#0D6E45] transition-all duration-200 group">
                  <svg class="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Volver</span>
                </a>
              </div>
              <div class="w-[55%] flex items-center justify-center p-2">
                <div class="relative w-full h-full rounded-[20px] overflow-hidden">
                  <img src="/images/inicio-de-sesion-final.webp" alt="Ganadería colombiana" class="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center center' }} />
                  <div class="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.25)] pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Slide 2: Register mode */}
            <div class="flex" style={{ width: '50%' }}>
              <div class="w-[55%] flex items-center justify-center p-2">
                <div class="relative w-full h-full rounded-[20px] overflow-hidden">
                  <img src="/images/farm-cows-sunset.webp" alt="Ganadería colombiana" class="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center center' }} />
                  <div class="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.25)] pointer-events-none"></div>
                </div>
              </div>
              <div class="w-[45%] bg-white/25 backdrop-blur-sm flex flex-col items-center justify-center px-10 py-10 relative">
                <div class="text-center mb-5">
                  <h1 class="text-[26px] font-semibold text-[#1F2937] tracking-tight" style={{ fontFamily: "'Inter', 'Manrope', system-ui, sans-serif" }}>Crear Cuenta</h1>
                  <p class="text-[#1F2937] text-sm mt-1.5">Únete al marketplace ganadero de Manizales</p>
                </div>
                <div class="w-full max-w-[340px]">
                  <RegistroForm onToggle={handleToggle} />
                </div>
                <a href="/" class="mt-4 inline-flex items-center gap-1.5 text-xs text-[#0B5D3B] hover:text-[#0D6E45] transition-all duration-200 group">
                  <svg class="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Volver</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
