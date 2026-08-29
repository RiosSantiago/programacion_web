// =============================================================================
// src/lib/rbac.ts — Utilidades centralizadas de control de acceso (RBAC)
// =============================================================================

import { queryGet } from './db';
import { getTokenFromRequest, type TokenPayload } from './auth';

export type Rol = 'root' | 'admin' | 'vendedor' | 'comprador';

const JERARQUIA: Record<Rol, number> = {
  root: 4,
  admin: 3,
  vendedor: 2,
  comprador: 1,
};

/**
 * Extrae el token del request y retorna el payload, o null si no hay token válido.
 */
export function getRequestUser(request: Request): TokenPayload | null {
  return getTokenFromRequest(request);
}

/**
 * Obtiene el rol del usuario desde la BD en tiempo real (no confiar solo en el token).
 */
export async function getRequestRole(request: Request): Promise<Rol | null> {
  const user = getTokenFromRequest(request);
  if (!user) return null;
  const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = $1', [user.id]);
  return (row?.rol as Rol) || null;
}

/**
 * Retorna true si el usuario tiene el rol requerido o superior.
 */
export async function hasRole(request: Request, minimo: Rol): Promise<boolean> {
  const rol = await getRequestRole(request);
  if (!rol) return false;
  return (JERARQUIA[rol] ?? 0) >= JERARQUIA[minimo];
}

/**
 * Retorna el payload del token y el rol de BD en una sola llamada.
 * útil para endpoints que necesitan ambos.
 */
export async function getAuthContext(request: Request): Promise<{
  user: TokenPayload;
  rol: Rol;
} | null> {
  const user = getTokenFromRequest(request);
  if (!user) return null;
  const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = $1', [user.id]);
  const rol = (row?.rol as Rol) || 'comprador';
  return { user, rol };
}

// ---------------------------------------------------------------------------
// Helpers de respuesta — errores comunes
// ---------------------------------------------------------------------------

export function unauthorized(message = 'No autorizado'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function forbidden(message = 'Acceso denegado'): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
