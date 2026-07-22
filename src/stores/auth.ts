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
}

export function logout() {
  $user.set(null);
  $isAuthenticated.set(false);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('agroup_user');
    localStorage.removeItem('agroup_token');
  }
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

// Check saved session
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('agroup_user');
  const token = localStorage.getItem('agroup_token');
  if (saved && token) {
    try {
      login(JSON.parse(saved));
    } catch (e) {
      localStorage.removeItem('agroup_user');
      localStorage.removeItem('agroup_token');
    }
  }
}