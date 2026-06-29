import { map } from 'nanostores';

interface Favorite {
  id: number;
  nombre: string;
  precio: number;
  precioOriginal?: number;
  imagen: string;
  addedAt: string;
}

interface PrecioAlert {
  productoId: number;
  precioAnterior: number;
  precioActual: number;
  productoNombre: string;
  detectedAt: string;
}

export const $favorites = map<Record<number, Favorite>>({});
export const $precioAlerts = map<Record<number, PrecioAlert>>({});

export function toggleFavorite(producto: Favorite) {
  const current = $favorites.get();
  if (current[producto.id]) {
    const { [producto.id]: _, ...rest } = current;
    $favorites.set(rest);
  } else {
    $favorites.setKey(producto.id, { ...producto, precioOriginal: producto.precio, addedAt: new Date().toISOString() });
  }
}

export function isFavorite(id: number): boolean {
  return !!$favorites.get()[id];
}

export function checkPriceChanges() {
  const favorites = $favorites.get();
  const productos = JSON.parse(localStorage.getItem('agrotech_productos') || '[]');

  Object.values(favorites).forEach((fav) => {
    const current = productos.find((p: any) => p.id === fav.id || p.id === Number(fav.id));
    if (current && current.precio !== fav.precioOriginal) {
      $precioAlerts.setKey(fav.id, {
        productoId: fav.id,
        precioAnterior: fav.precioOriginal || fav.precio,
        precioActual: current.precio,
        productoNombre: fav.nombre,
        detectedAt: new Date().toISOString(),
      });
    }
  });
}

// Load from localStorage
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('agrotech_favorites');
  if (saved) {
    try {
      $favorites.set(JSON.parse(saved));
    } catch (e) {
      localStorage.removeItem('agrotech_favorites');
    }
  }

  const savedAlerts = localStorage.getItem('agrotech_precio_alerts');
  if (savedAlerts) {
    try {
      $precioAlerts.set(JSON.parse(savedAlerts));
    } catch (e) {
      localStorage.removeItem('agrotech_precio_alerts');
    }
  }

  // Save on change
  $favorites.subscribe((value) => {
    localStorage.setItem('agrotech_favorites', JSON.stringify(value));
  });

  $precioAlerts.subscribe((value) => {
    localStorage.setItem('agrotech_precio_alerts', JSON.stringify(value));
  });
}
