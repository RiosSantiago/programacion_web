// =============================================================================
// src/lib/rate-limit.ts — Rate limiting in-memory (sin dependencias)
// Ventana fija por clave con expiración automática (TTL). Sirve para un
// deploy de un solo proceso Node (@astrojs/node). Si se escala a múltiples
// instancias, sustituir la implementación por una compartida (Redis/etc).
// =============================================================================

export const WINDOW_15_MIN = 15 * 60 * 1000;

interface Entry {
  count: number;
  resetAt: number;
}

export interface CheckResult {
  blocked: boolean;
  retryAfterSeconds: number;
}

export interface HitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export interface RateLimiter {
  /** Consulta si la clave está bloqueada SIN incrementar el contador. */
  isBlocked: (key: string) => CheckResult;
  /** Incrementa el contador de la clave y devuelve si aún está permitido. */
  hit: (key: string) => HitResult;
  /** Elimina el registro de la clave (ej. tras un login exitoso). */
  reset: (key: string) => void;
}

export function createRateLimiter(options: { windowMs: number; max: number }): RateLimiter {
  const store = new Map<string, Entry>();

  function sweepExpired(now: number, force = false) {
    if (force || store.size >= 5000) {
      for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key);
      }
    }
  }

  return {
    isBlocked(key) {
      const now = Date.now();
      sweepExpired(now);
      const entry = store.get(key);
      if (!entry || entry.resetAt <= now || entry.count <= options.max) {
        return { blocked: false, retryAfterSeconds: 0 };
      }
      return {
        blocked: true,
        retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
      };
    },

    hit(key) {
      const now = Date.now();
      sweepExpired(now);
      let entry = store.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + options.windowMs };
        store.set(key, entry);
      }
      entry.count += 1;
      if (entry.count > options.max) {
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
          remaining: 0,
        };
      }
      return { allowed: true, retryAfterSeconds: 0, remaining: options.max - entry.count };
    },

    reset(key) {
      store.delete(key);
    },
  };
}

/** Extrae la IP del cliente desde los headers proxy/reverse (patrón usado en vendor/vistas.ts). */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}