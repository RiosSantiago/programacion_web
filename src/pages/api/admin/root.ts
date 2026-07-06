import type { APIRoute } from 'astro';
import { db, inicializar } from '../../../lib/db';
import crypto from 'crypto';

const ADMIN_SECRET = 'agroup-root-2026';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, nombre, secret } = await request.json();

    if (secret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Clave secreta inválida' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email || !password || !nombre) {
      return new Response(JSON.stringify({ error: 'Email, contraseña y nombre son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    inicializar();

    const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (existing) {
      return new Response(JSON.stringify({ error: 'El email ya está registrado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hash = hashPassword(password);
    const result = db.prepare(
      'INSERT INTO usuarios (nombre, email, celular, password_hash, verificado, rol) VALUES (?, ?, ?, ?, 1, ?)'
    ).run(nombre, email, 'root', hash, 'root');

    return new Response(JSON.stringify({
      success: true,
      message: 'Usuario root creado exitosamente',
      id: result.lastInsertRowid,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
