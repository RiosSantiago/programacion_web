import { defineMiddleware } from 'astro/middleware';
import { existsSync, statSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { cwd } from 'process';
import { queryGet, inicializar } from './lib/db';
import { getTokenFromRequest } from './lib/auth';

let dbInicializada = false;

// En producción el servidor standalone sirve solo dist/client. Los archivos
// subidos en runtime viven en public/uploads (gitignored) y no se copian al
// build, así que se sirven aquí directamente desde el filesystem.
const UPLOADS_DIR = path.join(cwd(), 'public', 'uploads');
const UPLOADS_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function buildCsp(): string {
  const isProd = import.meta.env.PROD;

  // El uso extensivo de atributos de eventos inline (onclick="" etc.) en el
  // código (83+ handlers) y de scripts is:inline obliga a 'unsafe-inline'
  // en script-src. Google Identity Services solo exige permisos puntuales.
  const connect = [
    "'self'",
    'https://accounts.google.com',
    'https://sandbox.wompi.co',
    'https://production.wompi.co',
    // Vite HMR en desarrollo usa WebSocket del mismo origen
    ...(isProd ? [] : ['ws://localhost:*', 'wss://localhost:*']),
  ].join(' ');

  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://images.unsplash.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://*.googleusercontent.com",
    `connect-src ${connect}`,
    'frame-src https://accounts.google.com https://checkout.wompi.co',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ];

  return directives.join('; ');
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (!dbInicializada) {
    dbInicializada = true;
    try {
      await inicializar();
      console.log('[DB] Esquema PostgreSQL inicializado');
    } catch (e) {
      console.error('[DB] Error al inicializar esquema:', e);
    }
  }

  const url = new URL(context.request.url);

  const publicas = ['/api/admin/root', '/api/admin/check'];
  const isAdminApi = url.pathname.startsWith('/api/admin/') && !publicas.includes(url.pathname);

  // Aplica cabeceras de seguridad a una respuesta (CSP, frame, sniffer, etc.)
  const withSecurityHeaders = (response: Response): Response => {
    const headers = new Headers(response.headers);
    headers.set('Content-Security-Policy', buildCsp());
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    if (import.meta.env.PROD) {
      headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

  if (isAdminApi) {
    // Verificar JWT firmado (con fallback a legacy Base64 durante migración)
    const tokenPayload = getTokenFromRequest(context.request);
    if (!tokenPayload) {
      return withSecurityHeaders(
        new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    // Verificar rol en BD en tiempo real (no confiar solo en el payload del token)
    const row = await queryGet<{ rol: string }>('SELECT rol FROM usuarios WHERE id = ?', [tokenPayload.id]);
    const role = row?.rol || null;
    if (role !== 'root' && role !== 'admin') {
      return withSecurityHeaders(
        new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 403, headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
  }

  // ── Estáticos dinámicos: /uploads/* servidos desde public/uploads ──
  // (necesario en producción: dist/client no contiene archivos subidos en runtime)
  if (url.pathname.startsWith('/uploads/')) {
    const relative = decodeURIComponent(url.pathname.slice('/uploads/'.length));
    const filePath = path.join(UPLOADS_DIR, relative);
    const dentroDeUploads = filePath === UPLOADS_DIR || filePath.startsWith(UPLOADS_DIR + path.sep);
    if (!dentroDeUploads || !existsSync(filePath) || !statSync(filePath).isFile()) {
      return withSecurityHeaders(new Response('No encontrado', { status: 404 }));
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = UPLOADS_MIME[ext] || 'application/octet-stream';
    const data = await readFile(filePath);
    return withSecurityHeaders(
      new Response(new Uint8Array(data), {
        headers: { 'Content-Type': mime, 'Cache-Control': 'no-cache' },
      }),
    );
  }

  const response = await next();
  return withSecurityHeaders(response);
});
