// =============================================================================
// src/lib/auth.ts — Módulo centralizado de autenticación
// JWT con jsonwebtoken + bcryptjs
// =============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// CONFIGURACIÓN
// ---------------------------------------------------------------------------
const JWT_SECRET =
  (import.meta.env.JWT_SECRET as string) ||
  (process.env.JWT_SECRET as string) ||
  '';

const JWT_EXPIRES_IN = '30d'; // 30 días de validez para tokens de usuario
const BCRYPT_ROUNDS  = 12;     // factor de coste; ~250 ms en hardware moderno

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[auth] JWT_SECRET es obligatorio en producción. Define JWT_SECRET en tu .env');
  }
  console.warn(
    '[auth] ⚠️  JWT_SECRET no definido en .env. Los tokens serán inseguros.',
  );
}

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------
export interface TokenPayload {
  id:    number;
  email: string;
  rol:   string;
}

// ---------------------------------------------------------------------------
// JWT — generación y verificación
// ---------------------------------------------------------------------------

/**
 * Firma un JWT con { id, email, rol } y vencimiento de 30 días.
 */
export function generarToken(payload: TokenPayload): string {
  if (!JWT_SECRET) {
    throw new Error('[auth] JWT_SECRET no configurado. Agrega JWT_SECRET en tu .env');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica un JWT. Retorna el payload si es válido, o null si expiró / es inválido.
 * Compatible con tokens legados Base64 (sin firma) para migración transparente.
 */
export function verificarToken(token: string): TokenPayload | null {
  if (!token || !JWT_SECRET) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload & {
      iat?: number;
      exp?: number;
    };
    if (typeof payload.id !== 'number' || !payload.email) return null;
    return {
      id: payload.id,
      email: payload.email,
      rol: payload.rol || 'comprador',
    };
  } catch {
    // Token inválido, firma manipulada o expirado
    return null;
  }
}

/**
 * Extrae y verifica el token del header Authorization: Bearer <token>.
 */
export function getTokenFromRequest(request: Request): TokenPayload | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return verificarToken(auth.slice(7));
}

// ---------------------------------------------------------------------------
// BCRYPT — hashing y verificación
// ---------------------------------------------------------------------------

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

/**
 * Determina si un hash almacenado es un bcrypt hash (empieza con $2b$ o $2a$).
 */
function esBcryptHash(hash: string): boolean {
  return hash.startsWith('$2b$') || hash.startsWith('$2a$');
}

/**
 * Genera un bcrypt hash de la contraseña.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifica una contraseña contra su hash almacenado.
 *
 * Soporta migración transparente:
 *   - Si el hash almacenado es bcrypt → usa bcrypt.compare.
 *   - Si el hash almacenado es SHA-256 hex (legacy) → compara con SHA-256,
 *     y si coincide devuelve el nuevo bcrypt hash para que el llamador
 *     actualice el registro en la misma petición.
 *
 * Retorna:
 *   { ok: true, nuevoHash: null }           — bcrypt match ✅
 *   { ok: true, nuevoHash: string }         — SHA-256 match ✅ → rehashear
 *   { ok: false, nuevoHash: null }          — no coincide ❌
 */
export async function verificarPassword(
  password: string,
  hashAlmacenado: string,
): Promise<{ ok: boolean; nuevoHash: string | null }> {
  if (!hashAlmacenado) return { ok: false, nuevoHash: null };

  // ── Caso 1: hash bcrypt moderno ──────────────────────────────────────────
  if (esBcryptHash(hashAlmacenado)) {
    const ok = await bcrypt.compare(password, hashAlmacenado);
    return { ok, nuevoHash: null };
  }

  // ── Caso 2: hash SHA-256 legado (hex de 64 chars) ────────────────────────
  if (SHA256_HEX_REGEX.test(hashAlmacenado)) {
    const { createHash } = await import('crypto');
    const sha256 = createHash('sha256').update(password).digest('hex');
    if (sha256 === hashAlmacenado) {
      // Coincide: re-hashear con bcrypt para la próxima vez.
      const nuevoHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      return { ok: true, nuevoHash };
    }
    return { ok: false, nuevoHash: null };
  }

  // Hash en formato desconocido.
  console.warn('[auth] Hash en formato desconocido:', hashAlmacenado.slice(0, 10));
  return { ok: false, nuevoHash: null };
}
