import { $cart, $cartOpen, addToCart, fetchCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } from './cart';
import { $favorites, toggleFavorite, isFavorite } from './favorites';
import { $toasts, addToast, removeToast } from './toast';
import { $isAuthenticated, $user } from './auth';
import { escapeHtml } from '../lib/sanitize';

function formatearCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

function estaAbierto(id: string): boolean {
  const el = document.getElementById(id);
  return !!el && !el.classList.contains('translate-x-full');
}

function cerrarDrawer(overlayId: string, drawerId: string) {
  document.getElementById(overlayId)?.classList.add('hidden');
  document.getElementById(drawerId)?.classList.add('translate-x-full');
  const anyOpen = ['cart-drawer', 'favoritos-drawer', 'mobile-menu'].some(
    (id) => id !== drawerId && estaAbierto(id)
  );
  if (!anyOpen) document.body.style.overflow = '';
}

function abrirDrawer(overlayId: string, drawerId: string) {
  ['cart-drawer', 'favoritos-drawer', 'mobile-menu'].forEach((id) => {
    if (id !== drawerId && estaAbierto(id)) {
      const map: Record<string, string> = {
        'cart-drawer': 'cart-overlay',
        'favoritos-drawer': 'favoritos-overlay',
        'mobile-menu': 'mobile-menu-overlay',
      };
      cerrarDrawer(map[id], id);
    }
  });
  document.getElementById(overlayId)?.classList.remove('hidden');
  document.getElementById(drawerId)?.classList.remove('translate-x-full');
  document.body.style.overflow = 'hidden';
}

function abrirCarrito() {
  abrirDrawer('cart-overlay', 'cart-drawer');
}

function cerrarCarrito() {
  cerrarDrawer('cart-overlay', 'cart-drawer');
}

function abrirFavoritos() {
  abrirDrawer('favoritos-overlay', 'favoritos-drawer');
}

function cerrarFavoritos() {
  cerrarDrawer('favoritos-overlay', 'favoritos-drawer');
}

async function agregarAlCarrito(item: { id: number; nombre: string; precio: number; imagen: string; vendedor: string; cantidad?: number }) {
  const ok = await addToCart({
    id: item.id,
    nombre: item.nombre,
    precio: item.precio,
    cantidad: item.cantidad || 1,
    imagen: item.imagen || '/images/ganado.svg',
    vendedor: item.vendedor || '',
  });
  if (ok) abrirCarrito();
}

async function eliminarDelCarrito(id: number) {
  await removeFromCart(id);
}

async function cambiarCantidad(id: number, delta: number) {
  const items = $cart.get();
  const item = items.find((i) => i.id === id);
  if (item) {
    const nuevaCantidad = item.cantidad + delta;
    if (delta > 0 && item.stock !== undefined && nuevaCantidad > item.stock) {
      addToast(`Stock máximo disponible: ${item.stock}`, 'error');
      return;
    }
    await updateQuantity(id, nuevaCantidad);
  }
}

async function setCantidadManual(id: number, valStr: string) {
  const items = $cart.get();
  const item = items.find((i) => i.id === id);
  if (!item) return;

  let val = parseInt(valStr, 10);
  if (isNaN(val) || val < 1) {
    val = 1;
  }
  if (item.stock !== undefined && val > item.stock) {
    val = item.stock;
    addToast(`Stock máximo disponible: ${item.stock}`, 'error');
  }
  await updateQuantity(id, val);
}

async function vaciarCarrito() {
  const items = $cart.get();
  for (const item of items) {
    await removeFromCart(item.id);
  }
}

async function toggleFavoritoHandler(id: number, nombre: string, precio: number, imagen: string) {
  await toggleFavorite({ id, nombre, precio, imagen: imagen || '/images/ganado.svg' });
}

async function eliminarFavorito(id: number) {
  await toggleFavorite({ id, nombre: '', precio: 0, imagen: '' });
}

function esFavorito(id: number): boolean {
  return isFavorite(id);
}

function actualizarCarritoUI() {
  const items = $cart.get();
  const container = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  const countBadge = document.getElementById('cart-count');

  const totalItems = getCartCount();
  if (countBadge) countBadge.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;

  if (items.length === 0) {
    if (container) {
      container.innerHTML = `
        <div id="cart-empty" class="flex flex-col items-center justify-center h-full text-center py-12">
          <div class="w-24 h-24 bg-[#FFFDF7] rounded-2xl flex items-center justify-center mb-6 border border-[#E8E0D8]">
            <svg class="w-12 h-12 text-[#C4B09C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h4 class="text-lg font-display font-bold text-[#2D2D2D] mb-2">Tu carrito está vacío</h4>
          <p class="text-sm text-[#6B6B6B] mb-6">Explora nuestro marketplace y encuentra los mejores productos del campo colombiano</p>
          <a href="/marketplace" onclick="cerrarCarrito()" class="btn-primary">Explorar Marketplace</a>
        </div>
      `;
    }
    footer?.classList.add('hidden');
    return;
  }

  footer?.classList.remove('hidden');

  if (!container) return;
  container.innerHTML = '';
  items.forEach((item) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'flex gap-4 p-4 bg-white rounded-2xl border border-[#E8E0D8] shadow-sm hover:shadow-md transition-shadow';
    const maxAlcanzado = item.stock !== undefined && item.cantidad >= item.stock;
    const stockMax = item.stock ?? 999999;
    itemEl.innerHTML = `
      <img src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.nombre)}" class="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-bold text-[#2D2D2D] truncate">${escapeHtml(item.nombre)}</h4>
        <p class="text-xs text-[#6B6B6B] mt-0.5">${escapeHtml(item.vendedor)}</p>
        <p class="text-lg font-extrabold text-[#2D2D2D] mt-1">${formatearCOP(item.precio)}</p>
        ${item.stock !== undefined ? `<p class="text-[11px] font-medium ${maxAlcanzado ? 'text-coral-500 font-bold' : 'text-[#6B6B6B]'} mt-0.5">Stock disponible: ${item.stock}${maxAlcanzado ? ' (Máximo alcanzado)' : ''}</p>` : ''}
        <div class="flex items-center justify-between mt-3">
          <div class="flex items-center gap-1.5">
            <button onclick="cambiarCantidad(${item.id}, -1)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FFFDF7] text-[#6B6B6B] hover:bg-gold-50 hover:text-gold-700 transition-colors text-sm font-bold border border-[#E8E0D8]">-</button>
            <input type="number" min="1" max="${stockMax}" value="${item.cantidad}" onchange="setCantidadManual(${item.id}, this.value)" class="w-12 h-8 text-center text-sm font-semibold text-[#2D2D2D] border border-[#E8E0D8] rounded-lg bg-white focus:outline-none focus:border-campo-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            <button onclick="cambiarCantidad(${item.id}, 1)" ${maxAlcanzado ? 'disabled title="Stock máximo alcanzado"' : ''} class="w-8 h-8 flex items-center justify-center rounded-lg ${maxAlcanzado ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-[#FFFDF7] text-[#6B6B6B] hover:bg-gold-50 hover:text-gold-700 border-[#E8E0D8]'} transition-colors text-sm font-bold border">+</button>
          </div>
          <button onclick="eliminarDelCarrito(${item.id})" class="text-xs text-coral-500 hover:text-coral-700 font-medium transition-colors">Eliminar</button>
        </div>
      </div>
    `;
    container.appendChild(itemEl);
  });

  const subtotal = getCartTotal();
  const total = subtotal;

  const subtotalEl = document.getElementById('cart-subtotal');
  const transporteEl = document.getElementById('cart-transporte');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.textContent = formatearCOP(subtotal);
  if (transporteEl) transporteEl.textContent = 'Gratis';
  if (totalEl) totalEl.textContent = formatearCOP(total);
}

function actualizarNavCartCount() {
  const badge = document.getElementById('nav-cart-count');
  if (!badge) return;
  const items = $cart.get();
  const count = items.reduce((sum, item) => sum + item.cantidad, 0);
  badge.textContent = String(count);
  badge.classList.toggle('hidden', count === 0);
}

function actualizarFavoritosUI() {
  const favorites = $favorites.get();
  const container = document.getElementById('favoritos-items');
  const countEl = document.getElementById('favoritos-count');
  const navBadge = document.getElementById('nav-favoritos-count');
  const items = Object.values(favorites);

  if (countEl) countEl.textContent = `${items.length} producto${items.length !== 1 ? 's' : ''} guardado${items.length !== 1 ? 's' : ''}`;
  if (navBadge) {
    navBadge.textContent = String(items.length);
    navBadge.classList.toggle('hidden', items.length === 0);
  }

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-center py-12">
        <div class="w-24 h-24 bg-[#FFFDF7] rounded-2xl flex items-center justify-center mb-6 border border-[#E8E0D8]">
          <svg class="w-12 h-12 text-[#C4B09C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h4 class="text-lg font-display font-bold text-[#2D2D2D] mb-2">No tienes favoritos</h4>
        <p class="text-sm text-[#6B6B6B] mb-6">Guarda productos que te interesen para compararlos después</p>
        <a href="/marketplace" onclick="cerrarFavoritos()" class="btn-primary">Explorar Productos</a>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  items.forEach((item) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'flex gap-4 p-4 bg-white rounded-2xl border border-[#E8E0D8] shadow-sm hover:shadow-md transition-shadow';
    itemEl.innerHTML = `
      <a href="/marketplace/${item.id}" class="shrink-0">
        <img src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.nombre)}" class="w-20 h-20 rounded-xl object-cover" onerror="this.src='/images/ganado.svg'" />
      </a>
      <div class="flex-1 min-w-0">
        <a href="/marketplace/${item.id}" class="text-sm font-bold text-[#2D2D2D] line-clamp-2 hover:text-gold-700 transition-colors">${escapeHtml(item.nombre)}</a>
        <p class="text-lg font-extrabold text-[#2D2D2D] mt-1">${formatearCOP(item.precio)}</p>
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-[#6B6B6B]">Guardado</span>
          <button onclick="eliminarFavorito(${item.id})" class="text-xs text-coral-500 hover:text-coral-700 font-medium transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Quitar
          </button>
        </div>
      </div>
    `;
    container.appendChild(itemEl);
  });
}

function actualizarBotonesFavoritos() {
  const favorites = $favorites.get();
  const ids = new Set(Object.keys(favorites).map(Number));
  document.querySelectorAll('.btn-favorito').forEach((btn) => {
    const id = parseInt(btn.getAttribute('data-id') || '0');
    const esFav = ids.has(id);
    btn.classList.toggle('activo', esFav);
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', esFav ? '#f55a4e' : 'none');
      svg.setAttribute('stroke', esFav ? '#f55a4e' : 'currentColor');
    }
  });
}

function init() {
  // Expose shared stores & functions on window so all entry points use the same instances
  (window as any).__cartStore = $cart;
  (window as any).__favoritesStore = $favorites;
  (window as any).__toastsStore = $toasts;
  (window as any).__addToast = addToast;
  (window as any).__removeToast = removeToast;
  (window as any).__fetchCart = fetchCart;
  (window as any).__isAuthenticated = () => $isAuthenticated.get();
  (window as any).__getUser = () => $user.get();

  // Expose global functions
  (window as any).agregarAlCarrito = agregarAlCarrito;
  (window as any).eliminarDelCarrito = eliminarDelCarrito;
  (window as any).cambiarCantidad = cambiarCantidad;
  (window as any).setCantidadManual = setCantidadManual;
  (window as any).vaciarCarrito = vaciarCarrito;
  (window as any).abrirCarrito = abrirCarrito;
  (window as any).cerrarCarrito = cerrarCarrito;
  (window as any).abrirFavoritos = abrirFavoritos;
  (window as any).cerrarFavoritos = cerrarFavoritos;
  (window as any).toggleFavorito = toggleFavoritoHandler;
  (window as any).eliminarFavorito = eliminarFavorito;
  (window as any).esFavorito = esFavorito;

  // Toast reactivity
  const toastColorMap: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  const toastActionColorMap: Record<string, string> = {
    info: 'text-blue-700 hover:text-blue-900',
    success: 'text-green-700 hover:text-green-900',
    error: 'text-red-700 hover:text-red-900',
  };
  $toasts.subscribe(() => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toasts = $toasts.get();
    container.innerHTML = toasts.map((t) => `
      <div class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 animate-slide-in ${toastColorMap[t.type] || toastColorMap.info}">
        <span class="text-sm font-medium flex-1">${escapeHtml(t.message)}</span>
        ${t.action ? `<a href="${escapeHtml(t.action.href)}" class="text-sm font-bold whitespace-nowrap underline ${toastActionColorMap[t.type] || toastActionColorMap.info}">${escapeHtml(t.action.label)}</a>` : ''}
        <button onclick="document.dispatchEvent(new CustomEvent('dismiss-toast', {detail:{id:${t.id}}}))" class="ml-1 opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
      </div>
    `).join('');
  });
  document.addEventListener('dismiss-toast', ((e: CustomEvent) => {
    removeToast(e.detail.id);
  }) as EventListener);

  // Cart reactivity
  $cart.subscribe(() => {
    actualizarCarritoUI();
    actualizarNavCartCount();
  });
  $cartOpen.subscribe((open: boolean) => {
    if (open) abrirCarrito();
    else cerrarCarrito();
  });

  // Favorites reactivity
  $favorites.subscribe(() => {
    actualizarFavoritosUI();
    actualizarBotonesFavoritos();
    document.dispatchEvent(new CustomEvent('favoritos-changed', {
      detail: { favoritos: Object.values($favorites.get()), ids: Object.keys($favorites.get()).map(Number) },
    }));
  });

  // Initial render
  actualizarCarritoUI();
  actualizarNavCartCount();
  actualizarFavoritosUI();
  actualizarBotonesFavoritos();

  // Re-render on navigation
  window.addEventListener('pageshow', () => {
    actualizarCarritoUI();
    actualizarNavCartCount();
    actualizarFavoritosUI();
    actualizarBotonesFavoritos();
  });

  // Delegation: agregar al carrito
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.agregar-carrito-btn');
    if (btn) {
      console.log('[Agroup] Agregar clicked', btn);
      const item = {
        id: parseInt(btn.getAttribute('data-id') || '0'),
        nombre: btn.getAttribute('data-nombre') || '',
        precio: parseFloat(btn.getAttribute('data-precio') || '0'),
        imagen: btn.getAttribute('data-imagen') || '',
        vendedor: btn.getAttribute('data-vendedor') || '',
        cantidad: 1,
      };
      agregarAlCarrito(item).catch(err => console.error('[Agroup] Error agregando al carrito', err));
    }
  });

  // Delegation: abrir/cerrar carrito desde navbar
  document.addEventListener('click', (e) => {
    const cartBtn = (e.target as HTMLElement).closest('[data-open-cart]');
    if (cartBtn) {
      if (estaAbierto('cart-drawer')) cerrarCarrito();
      else abrirCarrito();
    }
  });

  // Delegation: toggle favorito
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.btn-favorito');
    if (!btn) return;
    e.stopPropagation();
    const id = parseInt(btn.getAttribute('data-id') || '0');
    const nombre = btn.getAttribute('data-nombre') || '';
    const precio = parseFloat(btn.getAttribute('data-precio') || '0');
    const imagen = btn.getAttribute('data-imagen') || '';
    toggleFavoritoHandler(id, nombre, precio, imagen);
  }, true);

  // Delegation: abrir/cerrar favoritos desde navbar
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-open-favoritos]');
    if (btn) {
      if (estaAbierto('favoritos-drawer')) cerrarFavoritos();
      else abrirFavoritos();
    }
  });

  // MutationObserver for dynamic favorite buttons
  const observer = new MutationObserver((mutations) => {
    const hasNewButtons = mutations.some((m) =>
      Array.from(m.addedNodes).some(
        (n) =>
          n instanceof HTMLElement &&
          (n.classList?.contains('btn-favorito') || n.querySelector?.('.btn-favorito'))
      )
    );
    if (hasNewButtons) actualizarBotonesFavoritos();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  console.log('[Agroup] client-init ready');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
