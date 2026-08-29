import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';
import { generarToken, hashPassword } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { nombre, email, celular, password } = await request.json();

    if (!nombre || !email || !celular || !password) {
      return new Response(JSON.stringify({ error: 'Todos los campos son requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const existente = await queryGet<{ id: number }>(
      'SELECT id FROM usuarios WHERE email = ? OR celular = ?',
      [email, celular],
    );
    if (existente) {
      return new Response(JSON.stringify({ error: 'Este email o celular ya está registrado' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hashear con bcrypt (12 rounds) — sin almacenar nunca el texto plano
    const passwordHash = await hashPassword(password);

    const { lastInsertRowid: usuarioId } = await queryRun(
      `INSERT INTO usuarios (nombre, email, celular, password_hash, verificado, rol,
        hacienda, ciudad, direccion, municipio, corregimiento)
       VALUES (?, ?, ?, ?, true, 'comprador', '', '', '', '', '')`,
      [nombre, email, celular, passwordHash],
    );

    const token = generarToken({ id: usuarioId, email, rol: 'comprador' });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: usuarioId, email, celular, nombre,
        verificado: true, rol: 'comprador', avatar: '',
        hacienda: '', ciudad: '', direccion: '', municipio: '', corregimiento: '',
        departamento: '', whatsapp: '', descripcion: '', especies: '[]', logo: '', portada: '',
      },
      token,
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error en registro:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};