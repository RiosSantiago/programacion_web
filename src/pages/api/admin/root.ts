import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';
import { hashPassword } from '../../../lib/auth';

// El secreto se lee del entorno (ROOT_ADMIN_KEY o ADMIN_SECRET) — nunca hardcodeado en código fuente.
const ADMIN_SECRET =
  (import.meta.env.ROOT_ADMIN_KEY as string) ||
  (process.env.ROOT_ADMIN_KEY as string) ||
  (import.meta.env.ADMIN_SECRET as string) ||
  (process.env.ADMIN_SECRET as string) ||
  '';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Configuración de servidor incompleta' }), { status: 500 });
    }

    const { email, password, nombre, secret } = await request.json();

    if (secret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Clave secreta inválida' }), { status: 403 });
    }

    if (!email || !password || !nombre) {
      return new Response(JSON.stringify({ error: 'Email, contraseña y nombre son requeridos' }), { status: 400 });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), { status: 400 });
    }

    const existing = await queryGet('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing) {
      return new Response(JSON.stringify({ error: 'El email ya está registrado' }), { status: 400 });
    }

    const hash = await hashPassword(password);
    const { lastInsertRowid: newId } = await queryRun(
      'INSERT INTO usuarios (nombre, email, celular, password_hash, verificado, rol) VALUES (?, ?, ?, ?, true, ?)',
      [nombre, email, `root_${Date.now()}`, hash, 'root'],
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Usuario root creado exitosamente',
      id: newId,
    }), { status: 200 });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
