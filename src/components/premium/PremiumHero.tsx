import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.7, ease: 'easeOut', delay },
});

export default function PremiumHero() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!parallaxRef.current) return;
      const speed = 0.35;
      const y = window.scrollY * speed;
      parallaxRef.current.style.transform = `translate3d(0, ${y}px, 0) scale(1.05)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#1F4D36]">
      {/* Parallax Background */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 w-full h-[120%] -top-[10%] bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80')`,
        }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1F4D36]/90 via-[#1F4D36]/60 to-[#1F4D36]/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F4D36] via-transparent to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#1F4D36]/80 to-transparent" />

      {/* Decorative radial gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#D9A441]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full pt-24 pb-20 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">

              {/* Badge */}
              <motion.div
                {...fadeUp(0.1)}
                className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/80 text-sm mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Marketplace Ganadero #1 de Colombia
              </motion.div>

              {/* Title */}
              <motion.h1
                {...fadeUp(0.25)}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                El campo colombiano
                <motion.span
                  initial={{ backgroundPosition: '0% 50%' }}
                  animate={{ backgroundPosition: '100% 50%' }}
                  transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
                  className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] via-[#F0C050] to-[#B8860B] bg-[length:200%_100%]"
                >
                  en tu bolsillo
                </motion.span>
              </motion.h1>

              {/* Gold divider */}
              <motion.div
                {...fadeUp(0.4)}
                className="w-24 h-1 bg-gradient-to-r from-[#D9A441] to-[#B8860B] rounded-full mx-auto my-8"
              />

              {/* Description */}
              <motion.p
                {...fadeUp(0.45)}
                className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light"
              >
                Compra y vende bovinos, equinos, porcinos y más.
                Directamente de los mejores productores de{' '}
                <span className="font-semibold text-white">Manizales y Caldas</span>.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                {...fadeUp(0.6)}
                className="flex flex-col sm:flex-row gap-4 mt-12 justify-center items-center"
              >
                <a
                  href="/marketplace"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#1F4D36] font-bold rounded-2xl shadow-2xl shadow-black/20 hover:bg-neutral-100 hover:shadow-3xl hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Explorar Marketplace
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <a
                  href="/publicar"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#2E6B4A] to-[#1F4D36] text-white font-bold rounded-2xl border border-white/20 shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 hover:from-[#3A7D56] hover:to-[#2A5C3F] transition-all duration-300 active:scale-[0.97]"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#D9A441]/20 flex items-center justify-center group-hover:bg-[#D9A441]/30 transition-colors">
                    <svg className="w-3.5 h-3.5 text-[#D9A441]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  Publicar mi Ganado
                </a>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                {...fadeUp(0.75)}
                className="flex flex-wrap items-center justify-center gap-8 mt-16 text-white/40 text-sm"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 00-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-white/60">Compra 100% Segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-white/60">Sin Intermediarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-white/60">Caldas, Colombia</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '1,200+', label: 'Animales registrados' },
              { value: '340+', label: 'Productores activos' },
              { value: '8', label: 'Departamentos' },
              { value: '98%', label: 'Satisfacción' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
                className="text-center p-3"
              >
                <div className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {stat.value}
                </div>
                <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 60C240 120 480 0 720 60C960 120 1200 0 1440 60V120H0V60Z"
            fill="white"
            opacity="1"
          />
          <path
            d="M0 70C240 130 480 10 720 70C960 130 1200 10 1440 70V120H0V70Z"
            fill="white"
            opacity="0.5"
          />
        </svg>
      </div>
    </section>
  );
}
