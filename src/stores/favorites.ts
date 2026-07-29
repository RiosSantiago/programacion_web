import { map } from 'nanostores';
import { $isAuthenticated } from './auth';

export interface Favorite {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  fecha_agregado: string;
}

export const $favorites = map<Record<number, Favorite>>({});

function getToken(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('agroup_token');
  }
  return null;
}

export async function fetchFavorites() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch('/api/favoritos', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data: any[] = await res.json();
      const map: Record<number, Favorite> = {};
      for (const item of data) {
        map[item.producto_id] = {
          id: item.producto_id,
          nombre: item.nombre,
          precio: parseFloat(String(item.precio)),
          imagen: item.imagen || '/images/ganado.svg',
          fecha_agregado: item.fecha_agregado,
        };
      }
      $favorites.set(map);
    }
  } catch (e) {
    console.error('Error fetching favorites:', e);
  }
}

export async function toggleFavorite(producto: { id: number; nombre: string; precio: number; imagen: string }): Promise<boolean> {
  if (!$isAuthenticated.get()) {
    (window as any).__addToast?.('Inicia sesión para guardar productos en favoritos', 'error', { label: 'Iniciar sesión', href: '/auth/login' });
    return false;
  }
  const token = getToken();
  if (!token) return false;
  const pid = producto.id;
  const current = $favorites.get();

  if (current[pid]) {
    try {
      const res = await fetch(`/api/favoritos/${pid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { [pid]: _, ...rest } = current;
        $favorites.set(rest);
        return true;
      }
      (window as any).__addToast?.('Error al quitar de favoritos', 'error');
    } catch (e) {
      console.error('Error removing favorite:', e);
      (window as any).__addToast?.('Error de red al quitar de favoritos', 'error');
    }
  } else {
    try {
      const res = await fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ producto_id: pid }),
      });
      if (res.ok) {
        await fetchFavorites();
        return true;
      }
      (window as any).__addToast?.('Error al agregar a favoritos', 'error');
    } catch (e) {
      console.error('Error adding favorite:', e);
      (window as any).__addToast?.('Error de red al agregar a favoritos', 'error');
    }
  }
  return false;
}

export function isFavorite(id: number): boolean {
  return !!$favorites.get()[id];
}

export function clearFavorites() {
  $favorites.set({});
}
