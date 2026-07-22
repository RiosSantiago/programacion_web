import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import crypto from 'crypto';

interface Usuario {
  id: number;
  email: string;
  reset_token: string;
  reset_token_exp: number;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'Token y contraseña son requeridos' }), {
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

    const usuario = db.prepare(
      'SELECT id, reset_token, reset_token_exp FROM usuarios WHERE reset_token = ?'
    ).get(token) as Usuario | undefined;

    if (!usuario) {
      return new Response(JSON.stringify({ error: 'El enlace no es válido o ya fue utilizado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (Date.now() > usuario.reset_token_exp) {
      return new Response(JSON.stringify({ error: 'El enlace ha expirado. Solicita uno nuevo.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passwordHash = hashPassword(password);

    db.prepare(
      'UPDATE usuarios SET password_hash = ?, password_text = ?, reset_token = ?, reset_token_exp = ? WHERE id = ?'
    ).run(passwordHash, password, '', 0, usuario.id);

    return new Response(JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
