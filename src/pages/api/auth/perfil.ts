import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import crypto from 'crypto';

interface Usuario {
  id: number;
  email: string;
  celular: string;
  nombre: string;
  password_hash: string | null;
  verificado: number;
  rol: string;
  avatar: string | null;
  created_at: string;
  hacienda: string | null;
  ciudad: string | null;
  direccion: string | null;
  municipio: string | null;
  corregimiento: string | null;
  departamento: string | null;
  whatsapp: string | null;
  descripcion: string | null;
  especies: string | null;
  logo: string | null;
  portada: string | null;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generarToken(id: number, email: string): string {
  const payload = { id, email, exp: Date.now() + 365 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export const PUT: APIRoute = async ({ request }) => {
  try {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let tokenPayload: { id: number; email: string; exp: number };
    try {
      tokenPayload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    } catch {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokenExpired = tokenPayload.exp < Date.now();
    const usuarioActual = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(tokenPayload.id) as Usuario | undefined;
    if (!usuarioActual) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const nuevoToken = generarToken(tokenPayload.id, usuarioActual.email);

    const body = await request.json();
    const nombre = body.nombre ?? usuarioActual.nombre;
    const email = body.email ?? usuarioActual.email;
    const celular = body.celular ?? usuarioActual.celular;
    const hacienda = body.hacienda ?? usuarioActual.hacienda ?? '';
    const ciudad = body.ciudad ?? usuarioActual.ciudad ?? '';
    const direccion = body.direccion ?? usuarioActual.direccion ?? '';
    const municipio = body.municipio ?? usuarioActual.municipio ?? '';
    const corregimiento = body.corregimiento ?? usuarioActual.corregimiento ?? '';
    const departamento = body.departamento ?? usuarioActual.departamento ?? '';
    const whatsapp = body.whatsapp ?? usuarioActual.whatsapp ?? '';
    const descripcion = body.descripcion ?? usuarioActual.descripcion ?? '';
    const especies = body.especies ?? usuarioActual.especies ?? '[]';
    const logo = body.logo ?? usuarioActual.logo ?? '';
    const portada = body.portada ?? usuarioActual.portada ?? '';
    const avatar = body.avatar ?? usuarioActual.avatar ?? '';
    const passwordActual = body.passwordActual;
    const password = body.password;

    if (email !== usuarioActual.email) {
      const existente = db.prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?').get(email, tokenPayload.id);
      if (existente) {
        return new Response(JSON.stringify({ error: 'Este email ya está en uso por otro usuario' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (celular !== usuarioActual.celular) {
      const existente = db.prepare('SELECT id FROM usuarios WHERE celular = ? AND id != ?').get(celular, tokenPayload.id);
      if (existente) {
        return new Response(JSON.stringify({ error: 'Este celular ya está en uso por otro usuario' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (password) {
      if (!passwordActual) {
        return new Response(JSON.stringify({ error: 'Debes ingresar tu contraseña actual' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const oldHash = hashPassword(passwordActual);
      if (oldHash !== usuarioActual.password_hash) {
        return new Response(JSON.stringify({ error: 'La contraseña actual no es correcta' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const passwordHash = hashPassword(password);
      db.prepare(`
        UPDATE usuarios SET nombre = ?, email = ?, celular = ?, password_hash = ?, password_text = ?,
          hacienda = ?, ciudad = ?, direccion = ?, municipio = ?, corregimiento = ?,
          departamento = ?, whatsapp = ?, descripcion = ?, especies = ?, logo = ?, portada = ?, avatar = ?
        WHERE id = ?
      `).run(nombre, email, celular, passwordHash, password, hacienda, ciudad, direccion, municipio, corregimiento,
        departamento, whatsapp, descripcion, especies, logo, portada, avatar, tokenPayload.id);
    } else {
      db.prepare(`
        UPDATE usuarios SET nombre = ?, email = ?, celular = ?,
          hacienda = ?, ciudad = ?, direccion = ?, municipio = ?, corregimiento = ?,
          departamento = ?, whatsapp = ?, descripcion = ?, especies = ?, logo = ?, portada = ?, avatar = ?
        WHERE id = ?
      `).run(nombre, email, celular, hacienda, ciudad, direccion, municipio, corregimiento,
        departamento, whatsapp, descripcion, especies, logo, portada, avatar, tokenPayload.id);
    }

    const userResponse = {
      id: tokenPayload.id,
      email,
      celular,
      nombre,
      verificado: usuarioActual.verificado === 1,
      rol: usuarioActual.rol,
      avatar: body.avatar ?? usuarioActual.avatar,
      hacienda,
      ciudad,
      direccion,
      municipio,
      corregimiento,
      departamento,
      whatsapp,
      descripcion,
      especies,
      logo,
      portada,
    };

    return new Response(JSON.stringify({ success: true, user: userResponse, token: nuevoToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en actualizar perfil:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
