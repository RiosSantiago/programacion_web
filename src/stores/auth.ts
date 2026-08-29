import { atom } from 'nanostores';

export interface User {
  id: number;
  email: string;
  celular: string;
  nombre: string;
  verificado: boolean;
  rol: '' | 'admin' | 'root';
  avatar?: string;
  created_at?: string;
  hacienda?: string;
  ciudad?: string;
  direccion?: string;
  municipio?: string;
  corregimiento?: string;
  departamento?: string;
  whatsapp?: string;
  descripcion?: string;
  especies?: string;
  logo?: string;
  portada?: string;
}

export const $user = atom<User | null>(null);
export const $isAuthenticated = atom(false);

export function login(user: User) {
  $user.set(user);
  $isAuthenticated.set(true);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('agroup_user', JSON.stringify(user));
  }
  hydrateStores().catch(() => {});
}

export function logout() {
  $user.set(null);
  $isAuthenticated.set(false);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('agroup_user');
    localStorage.removeItem('agroup_token');
  }
  resetStores();
}

export function updateUser(user: User) {
  $user.set(user);
  $isAuthenticated.set(true);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('agroup_user', JSON.stringify(user));
  }
}

export function setToken(token: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('agroup_token', token);
  }
}

export function getToken(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('agroup_token');
  }
  return null;
}

async function hydrateStores() {
  const { fetchCart } = await import('./cart');
  const { fetchFavorites } = await import('./favorites');
  await Promise.all([fetchCart(), fetchFavorites()]);
}

function resetStores() {
  import('./cart').then(m => m.clearCart()).catch(() => {});
  import('./favorites').then(m => m.clearFavorites()).catch(() => {});
}

if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('agroup_user');
  const token = localStorage.getItem('agroup_token');
  if (saved && token) {
    try {
      const user: User = JSON.parse(saved);
      $user.set(user);
      $isAuthenticated.set(true);
      hydrateStores().catch(() => {});
    } catch (e) {
      localStorage.removeItem('agroup_user');
      localStorage.removeItem('agroup_token');
    }
  }
}
