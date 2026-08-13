import { atom } from 'nanostores';
import { $isAuthenticated } from './auth';

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  vendedor: string;
  vendedor_id?: number;
  stock?: number;
}

export const $cart = atom<CartItem[]>([]);
export const $cartOpen = atom(false);

function getToken(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('agroup_token');
  }
  return null;
}

interface ApiItem {
  producto_id: number;
  nombre: string;
  precio: string | number;
  cantidad: number;
  imagen: string | null;
  vendedor: string;
  vendedor_id: number;
  stock?: number;
}

function mapApiItem(item: ApiItem): CartItem {
  return {
    id: item.producto_id,
    nombre: item.nombre,
    precio: parseFloat(String(item.precio)),
    cantidad: item.cantidad,
    imagen: item.imagen || '/images/ganado.svg',
    vendedor: item.vendedor || '',
    vendedor_id: item.vendedor_id,
    stock: item.stock !== undefined && item.stock !== null ? Number(item.stock) : 999999,
  };
}

export async function fetchCart() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch('/api/carrito', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data: ApiItem[] = await res.json();
      $cart.set(data.map(mapApiItem));
    }
  } catch (e) {
    console.error('Error fetching cart:', e);
  }
}

export async function addToCart(item: { id: number; nombre: string; precio: number; cantidad?: number; imagen: string; vendedor: string; vendedor_id?: number }): Promise<boolean> {
  if (!$isAuthenticated.get()) {
    (window as any).__addToast?.('Inicia sesión para agregar productos al carrito', 'error', { label: 'Iniciar sesión', href: '/auth/login' });
    return false;
  }
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/carrito', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ producto_id: item.id, cantidad: item.cantidad ?? 1 }),
    });
    if (res.ok) {
      await fetchCart();
      return true;
    }
    const data = await res.json().catch(() => ({}));
    const msg = data.error || `Error al agregar (${res.status})`;
    (window as any).__addToast?.(msg, 'error');
  } catch (e) {
    console.error('Error adding to cart:', e);
    (window as any).__addToast?.('Error de red al agregar al carrito', 'error');
  }
  return false;
}

export async function removeFromCart(id: number): Promise<boolean> {
  if (!$isAuthenticated.get()) return false;
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`/api/carrito/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchCart();
      return true;
    }
  } catch (e) {
    console.error('Error removing from cart:', e);
  }
  return false;
}

export async function updateQuantity(id: number, cantidad: number): Promise<boolean> {
  if (!$isAuthenticated.get()) return false;
  const token = getToken();
  if (!token) return false;
  try {
    if (cantidad <= 0) {
      return await removeFromCart(id);
    }
    const res = await fetch(`/api/carrito/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ cantidad }),
    });
    if (res.ok) {
      await fetchCart();
      return true;
    }
    const data = await res.json().catch(() => ({}));
    const msg = data.error || `Error al actualizar cantidad (${res.status})`;
    (window as any).__addToast?.(msg, 'error');
  } catch (e) {
    console.error('Error updating quantity:', e);
  }
  return false;
}

export function clearCart() {
  $cart.set([]);
}

export function toggleCart() {
  $cartOpen.set(!$cartOpen.get());
}

export function getCartTotal(): number {
  return $cart.get().reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

export function getCartCount(): number {
  return $cart.get().reduce((sum, item) => sum + item.cantidad, 0);
}

export function openCart() {
  $cartOpen.set(true);
}

export function closeCart() {
  $cartOpen.set(false);
}
