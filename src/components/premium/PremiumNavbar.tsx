import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/dashboard', label: 'Mi Hacienda' },
];

export default function PremiumNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#1F4D36]/95 backdrop-blur-xl shadow-lg shadow-black/10'
            : 'bg-[#1F4D36]/70 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-11 h-11 bg-gradient-to-br from-[#D9A441] to-[#B8860B] rounded-xl flex items-center justify-center shadow-lg shadow-[#D9A441]/20 group-hover:shadow-xl group-hover:shadow-[#D9A441]/30 group-hover:scale-105 transition-all duration-300">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M9 21V10l6-6M9 21l6-12M9 21l4-8M15 21l-2 8M15 21l2-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="7" cy="16" r="2" fill="currentColor" opacity="0.5"/>
                  <circle cx="11" cy="18" r="1.5" fill="currentColor" opacity="0.3"/>
                </svg>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  AgroUp
                </span>
                <span className="hidden sm:block text-[10px] text-[#D9A441]/80 font-medium -mt-1 tracking-wide uppercase">
                  Mercado Ganadero
                </span>
              </div>
            </a>

            {/* Search */}
            <div className="hidden lg:flex flex-1 max-w-lg mx-6">
              <div className="relative w-full group">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#D9A441] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar ganado, razas, haciendas..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D9A441]/50 focus:bg-white/15 focus:ring-2 focus:ring-[#D9A441]/20 transition-all duration-300"
                />
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Nav Links */}
              <div className="hidden lg:flex items-center gap-0.5">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href="/publicar"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D9A441] to-[#B8860B] text-white text-sm font-bold rounded-xl hover:from-[#C8942E] hover:to-[#A07509] shadow-lg shadow-[#D9A441]/20 hover:shadow-xl hover:shadow-[#D9A441]/30 transition-all duration-300 active:scale-[0.97]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Publicar</span>
              </a>

              {/* Cart */}
              <button className="relative w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#D9A441] text-[#1F4D36] text-[9px] font-bold rounded-full flex items-center justify-center">0</span>
              </button>

              {/* Favorites */}
              <button className="hidden sm:relative sm:flex w-10 h-10 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Notifications */}
              <button className="hidden sm:relative sm:flex w-10 h-10 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
              </button>

              {/* Avatar */}
              <div className="w-9 h-9 ml-1 bg-black rounded-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-105 transition-transform duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search bar mobile */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/10"
            >
              <div className="px-4 py-3">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full pl-11 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#D9A441]/50 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85vw] max-w-[20rem] bg-gradient-to-b from-[#1F4D36] to-[#132D1A] shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <span className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Menú</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-3.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-4 mt-4 border-t border-white/10">
                  <a
                    href="/publicar"
                    className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-[#D9A441] to-[#B8860B] text-white text-sm font-bold rounded-xl hover:from-[#C8942E] hover:to-[#A07509] transition-all"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Publicar mi Ganado
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
